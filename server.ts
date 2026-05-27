import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabaseConfigured: !!supabaseUrl });
});

// Example endpoint to sync app state
app.post("/api/sync", async (req, res) => {
  const { userId, state } = req.body;
  if (!supabaseUrl) return res.status(500).json({ error: "Supabase not configured" });

  try {
    // In a real app, you would have separate tables. 
    // Here we'll store the blob in a 'user_states' table as an example.
    const { data, error } = await supabase
      .from('user_states')
      .upsert({ user_id: userId, app_state: state })
      .select();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/state/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!supabaseUrl) return res.status(500).json({ error: "Supabase not configured" });

  try {
    const { data, error } = await supabase
      .from('user_states')
      .select('app_state')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows found'
    res.json(data?.app_state || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
