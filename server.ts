import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const app = express();
const PORT = 3000;

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { files: 3, fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

app.use(express.json({ limit: '50mb' }));

// API Routes
app.post("/api/analyze", upload.array("files", 3), async (req, res) => {
  try {
    const { prompt, model, tools } = req.body;
    const files = req.files as Express.Multer.File[];

    let fileContents = [];
    if (files) {
      for (const file of files) {
        if (file.mimetype === "application/pdf") {
          const dataBuffer = fs.readFileSync(file.path);
          const data = await pdf(dataBuffer);
          fileContents.push({ name: file.originalname, content: data.text, type: 'text' });
        } else if (file.mimetype.startsWith("image/")) {
          const base64 = fs.readFileSync(file.path, { encoding: 'base64' });
          fileContents.push({ name: file.originalname, content: base64, type: 'image', mimeType: file.mimetype });
        } else {
          const content = fs.readFileSync(file.path, 'utf-8');
          fileContents.push({ name: file.originalname, content, type: 'text' });
        }
        // Clean up uploaded file
        fs.unlinkSync(file.path);
      }
    }

    // In a real app, we'd call external scrapers here.
    // For this demo, we'll pass the "intent" to the frontend Gemini call
    // or handle it here if we had the API key on the backend.
    // Since the instructions say "Always call Gemini API from the frontend",
    // we'll return the processed file data to the frontend for the final analysis.

    res.json({
      success: true,
      processedFiles: fileContents,
      scrapedIntel: [
        "Recent CVE-2024-XXXX vulnerability detected in common architectural patterns.",
        "Dark web chatter indicates increased targeting of SIEM misconfigurations.",
        "New ransomware variant 'BISE-Alpha' observed in the wild."
      ]
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to process analysis request" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BISE Server running on http://localhost:${PORT}`);
  });
}

startServer();
