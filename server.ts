import express from "express";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { Resend } from "resend";
// @ts-ignore
import { PNG } from "pngjs";
// @ts-ignore
import jpeg from "jpeg-js";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "user_data.json");
const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

// Setup Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy Gemini Initialization to avoid crashing on start if the key is missing
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
};

// Pure JavaScript/TypeScript local face and wall detector
function verifyFaceLocal(base64Data: string, mimeType: string): { isValid: boolean; reason: string } {
  try {
    const buf = Buffer.from(base64Data, 'base64');
    let pixels: Buffer | Uint8Array;
    let width = 0;
    let height = 0;

    if (mimeType === 'image/png') {
      const png = PNG.sync.read(buf);
      pixels = png.data;
      width = png.width;
      height = png.height;
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      const rawData = jpeg.decode(buf, { useTArray: true });
      pixels = rawData.data;
      width = rawData.width;
      height = rawData.height;
    } else {
      return {
        isValid: false,
        reason: "Unsupported image format. Please capture a clear photograph in PNG or JPEG format."
      };
    }

    if (width < 80 || height < 80) {
      return {
        isValid: false,
        reason: "Image resolution is too low. Please upload a clear, high-resolution portrait photograph."
      };
    }

    const numSamples = 1000;
    const step = Math.max(1, Math.floor((width * height) / numSamples));
    
    let skinCount = 0;
    let rSum = 0, gSum = 0, bSum = 0;
    let rSqSum = 0, gSqSum = 0, bSqSum = 0;
    let sampledCount = 0;

    for (let i = 0; i < width * height; i += step) {
      const idx = i * 4;
      if (idx + 2 >= pixels.length) break;

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      rSum += r;
      gSum += g;
      bSum += b;
      rSqSum += r * r;
      gSqSum += g * g;
      bSqSum += b * b;
      sampledCount++;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isSkin = r > 95 && g > 40 && b > 20 && (r - g) > 15 && r > g && r > b && (max - min) > 15;
      if (isSkin) {
        skinCount++;
      }
    }

    if (sampledCount === 0) {
      return {
        isValid: false,
        reason: "Unable to process the image pixels. Please select a valid profile photograph."
      };
    }

    const mR = rSum / sampledCount;
    const mG = gSum / sampledCount;
    const mB = bSum / sampledCount;

    const varR = Math.max(0, (rSqSum / sampledCount) - (mR * mR));
    const varG = Math.max(0, (gSqSum / sampledCount) - (mG * mG));
    const varB = Math.max(0, (bSqSum / sampledCount) - (mB * mB));

    const sdR = Math.sqrt(varR);
    const sdG = Math.sqrt(varG);
    const sdB = Math.sqrt(varB);

    const avgSD = (sdR + sdG + sdB) / 3;
    const skinRatio = skinCount / sampledCount;

    if (avgSD < 18) {
      return {
        isValid: false,
        reason: "No human face detected. The uploaded image is too uniform, flat (like a wall), or lacks photographic texture."
      };
    }

    if (skinRatio < 0.03) {
      return {
        isValid: false,
        reason: "No human face detected. Please ensure your face is clearly visible, has natural lighting, and is not obscured."
      };
    }

    if (skinRatio > 0.82) {
      return {
        isValid: false,
        reason: "The uploaded image is too uniform and lacks facial structure. Please capture a natural profile photo."
      };
    }

    return { isValid: true, reason: "" };

  } catch (err: any) {
    console.error("Local face verification error:", err);
    return {
      isValid: false,
      reason: "Malformed or corrupted image. Please capture a clear, authentic face photo with your camera."
    };
  }
}

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

if (inMemoryStore._gig_applications && Array.isArray(inMemoryStore._gig_applications)) {
  let dirty = false;
  inMemoryStore._gig_applications = inMemoryStore._gig_applications.map((app: any, idx: number) => {
    if (!app.id) { app.id = Date.now() + idx; dirty = true; }
    if (!app.appliedAt) { app.appliedAt = new Date().toISOString(); dirty = true; }
    if (!app.status) { app.status = "pending"; dirty = true; }
    return app;
  });
  if (dirty) { saveLocalData(inMemoryStore); }
}

// ==================== API ROUTES ====================

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    supabaseConfigured: !!supabase,
    storage: supabase ? "Supabase (with Local Fallback)" : "Local File System"
  });
});

app.get("/api/check-account", async (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: "Email required" });

  const normalizedEmail = email.trim().toLowerCase();
  let exists = !!inMemoryStore[normalizedEmail];
  
  if (!exists && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();
        
      if (data) exists = true;
    } catch (err) {
      console.error("Supabase access error:", err);
    }
  }
  res.json({ exists });
});

// ==================== VITE / STATIC ROUTING ====================

if (!isProd) {
  // Only import and initialize Vite in local development mode
  import("vite").then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, () => console.log(`Dev server active on http://localhost:${PORT}`));
    });
  });
} else {
  // In production (Vercel), serve pre-built assets
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Catch-all route to serve the built index.html for SPA router support
  app.get("*", (req, res) => {
    if (req.path.startsWith('/api')) return;
    res.sendFile(path.join(distPath, "index.html"));
  });

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => console.log(`Production server running on port ${PORT}`));
  }
}

export default app;
