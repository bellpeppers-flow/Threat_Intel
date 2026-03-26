import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists
  const UPLOADS_DIR = "uploads/";
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
  }

  // Configure multer for file uploads
  const upload = multer({
    dest: UPLOADS_DIR,
    limits: { files: 3, fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.all(["/api/v2/analyze", "/api/v2/analyze/"], (req, res, next) => {
    console.log(`[DEBUG] /api/v2/analyze hit with method: ${req.method}`);
    if (req.method !== 'POST') {
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
    next();
  });

  app.post(["/api/v2/analyze", "/api/v2/analyze/"], (req, res) => {
    console.log("POST /api/v2/analyze received");
    upload.array("files", 3)(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: "Maximum 3 files allowed." });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "File upload failed: " + err.message });
      }

      try {
        const { prompt, model, tools } = req.body;
        const files = req.files as Express.Multer.File[];

        console.log(`Processing ${files?.length || 0} files for prompt: ${prompt?.substring(0, 50)}...`);

        let fileContents = [];
        if (files) {
          for (const file of files) {
            try {
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
            } catch (fileErr) {
              console.error(`Error processing file ${file.originalname}:`, fileErr);
            } finally {
              // Clean up uploaded file
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            }
          }
        }

        console.log("Sending successful response back to client");
        res.json({
          success: true,
          processedFiles: fileContents,
          scrapedIntel: [] // AI now handles real-time scraping via Google Search grounding
        });
      } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({ error: "Failed to process analysis request: " + (error as Error).message });
      }
    });
  });

  // Catch-all for other POST requests to help debug
  app.post("/api/*", (req, res) => {
    console.warn(`Unmatched POST request to ${req.url}`);
    res.status(404).json({ error: `Route ${req.url} not found` });
  });

  // Vite middleware for development
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

  // Global error handler (must be last)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global server error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BISE Server running on http://localhost:${PORT}`);
  });
}

startServer();
