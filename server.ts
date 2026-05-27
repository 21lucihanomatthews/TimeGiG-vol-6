import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "user_data.json");

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

// Persistence helper for fallback
function loadLocalData(): Record<string, any> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("[Local Storage] Error loading data:", e);
  }
  return {};
}

function saveLocalData(data: Record<string, any>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[Local Storage] Error saving data:", e);
  }
}

let inMemoryStore = loadLocalData();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    supabaseConfigured: !!supabase,
    storage: supabase ? "Supabase (with Local Fallback)" : "Local File System"
  });
});

// Admin payments helper
const adminEmail = '21lucihanomatthews@gmail.com';

app.post("/api/admin/approve-topup", async (req, res) => {
  const { userEmail, amount, adminEmail: passedAdminEmail, requestId } = req.body;
  if (passedAdminEmail !== adminEmail) return res.status(403).json({ error: "Unauthorized" });

  const amountNum = Number(amount);

  if (!inMemoryStore[userEmail]) {
    return res.status(404).json({ error: "User not found" });
  }

  // Add balance to user
  inMemoryStore[userEmail].balance = (inMemoryStore[userEmail].balance || 0) + amountNum;
  
  // Record transaction for user
  if (!inMemoryStore[userEmail].transactions) inMemoryStore[userEmail].transactions = [];
  inMemoryStore[userEmail].transactions.unshift({
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    type: 'bought',
    amount: amountNum,
    note: 'Top-up Approved'
  });

  // Remove from pending
  if (inMemoryStore[userEmail].pendingApprovals) {
    inMemoryStore[userEmail].pendingApprovals = inMemoryStore[userEmail].pendingApprovals.filter((p: any) => p.id !== requestId);
  }

  saveLocalData(inMemoryStore);
  res.json({ status: "ok", newBalance: inMemoryStore[userEmail].balance });
});

app.post("/api/admin/reject-topup", async (req, res) => {
  const { userEmail, adminEmail: passedAdminEmail, requestId } = req.body;
  if (passedAdminEmail !== adminEmail) return res.status(403).json({ error: "Unauthorized" });

  if (inMemoryStore[userEmail] && inMemoryStore[userEmail].pendingApprovals) {
    inMemoryStore[userEmail].pendingApprovals = inMemoryStore[userEmail].pendingApprovals.filter((p: any) => p.id !== requestId);
    saveLocalData(inMemoryStore);
  }
  res.json({ status: "ok" });
});

app.get("/api/admin/pending-approvals", (req, res) => {
  const { adminEmail: passedAdminEmail } = req.query;
  if (passedAdminEmail !== adminEmail) return res.status(403).json({ error: "Unauthorized" });

  const allPending: any[] = [];
  Object.keys(inMemoryStore).forEach(userId => {
    const state = inMemoryStore[userId];
    if (state && state.pendingApprovals && Array.isArray(state.pendingApprovals)) {
      state.pendingApprovals.forEach((pa: any) => {
        // Only return if not already handled locally (though this app uses state-based removal)
        allPending.push({ ...pa, user: userId });
      });
    }
  });

  res.json(allPending);
});

// Sync app state
app.post("/api/sync", async (req, res) => {
  const { userId, state } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const existingState = inMemoryStore[userId] || {};
  
  // MERGE logic to prevent data loss from out-of-band updates (like direct payments or admin approvals)
  // We prioritize the NEW state for most fields, but merge collections that could be updated server-side
  const mergedState = {
    ...state,
    // Preserve balance and receipts if server has newer/more data (very basic heuristic: larger balance)
    balance: Math.max(state.balance || 0, existingState.balance || 0),
    // For transactions, we try to merge uniquely by id
    transactions: [
      ...(state.transactions || []),
      ...(existingState.transactions || []).filter((et: any) => !(state.transactions || []).some((st: any) => st.id === et.id))
    ].sort((a, b) => b.id - a.id).slice(0, 50) // Keep top 50
  };

  // Update memory and disk immediately (fallback strategy)
  inMemoryStore[userId] = mergedState;
  saveLocalData(inMemoryStore);

  if (!supabase) {
    return res.json({ status: "saved_locally", message: "Supabase not configured, using local file storage.", state: mergedState });
  }

  try {
    const { data, error } = await supabase
      .from('user_states')
      .upsert({ user_id: userId, app_state: mergedState })
      .select();

    if (error) {
       // Silent fallback if table is missing or DB error occurs
       return res.json({ status: "saved_locally_via_fallback", message: error.message, state: mergedState });
    }
    res.json(data);
  } catch (err: any) {
    res.json({ status: "saved_locally_via_fallback", error: err.message, state: mergedState });
  }
});

app.get("/api/state/:userId", async (req, res) => {
  const { userId } = req.params;
  
  if (!supabase) {
    return res.json(inMemoryStore[userId] || {});
  }

  try {
    const { data, error } = await supabase
      .from('user_states')
      .select('app_state')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If Supabase fails (e.g. missing table), always return from local store
      return res.json(inMemoryStore[userId] || {});
    }
    
    res.json(data?.app_state || {});
  } catch (err: any) {
    // Catch catch-all
    res.json(inMemoryStore[userId] || {});
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`);
  });
}

startServer();
