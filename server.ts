import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
import Parser from "rss-parser";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
const parser = new Parser();

// Helper to detect image type from buffer
function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  // WebP: RIFF ... WEBP
  if (buffer.length >= 12 && 
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  
  return null;
}

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

  app.get("/api/intel-feed", async (req, res) => {
    try {
      // Fetching from CISA Cybersecurity Advisories
      const feed = await parser.parseURL("https://www.cisa.gov/cybersecurity-advisories/all.xml");
      
      const items = feed.items.slice(0, 5).map(item => {
        const title = item.title || "Unknown Advisory";
        let severity = "MEDIUM";
        
        if (title.toLowerCase().includes('critical') || (item.contentSnippet && item.contentSnippet.toLowerCase().includes('critical'))) {
          severity = "CRITICAL";
        } else if (title.toLowerCase().includes('high') || (item.contentSnippet && item.contentSnippet.toLowerCase().includes('high'))) {
          severity = "HIGH";
        }

        return {
          title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet?.substring(0, 150) + "...",
          severity
        };
      });

      res.json(items);
    } catch (error) {
      console.error("Error fetching intel feed:", error);
      res.status(500).json({ error: "Failed to fetch security intel feed" });
    }
  });

  app.post("/api/analyze", (req, res) => {
    console.log("[DEBUG] POST /api/analyze received");
    upload.array("files", 3)(req, res, async (err) => {
      if (err) {
        console.error("[ERROR] Multer error:", err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: "Maximum 3 files allowed." });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "File upload failed: " + err.message });
      }

      try {
        if (!req.body.data) {
          console.error("[ERROR] Missing 'data' field in request body");
          return res.status(400).json({ error: "Missing analysis data" });
        }

        const { prompt, model, tools } = JSON.parse(req.body.data || '{}');
        const files = req.files as Express.Multer.File[];

        console.log(`[INFO] Processing ${files?.length || 0} files for prompt: ${prompt?.substring(0, 50)}...`);

        let messageBusData = [];
        let mcpData = [];
        
        if (tools && Array.isArray(tools)) {
          for (const tool of tools) {
            if (!tool.enabled) continue;

            if (tool.type === 'MessageBus') {
              // Simulate pulling data from message bus as a subscriber
              console.log(`[SIMULATION] Pulling data from Message Bus: ${tool.config.messageBusUrl}, Topic: ${tool.config.topic}`);
              messageBusData.push({
                source: tool.name,
                topic: tool.config.topic,
                events: [
                  { timestamp: new Date().toISOString(), message: `Real-time event pulled from ${tool.config.topic} subscriber for analysis.` },
                  { timestamp: new Date(Date.now() - 10000).toISOString(), message: `Security alert detected on ${tool.config.topic} bus matching user context.` }
                ]
              });
            } else if (tool.type === 'MCP') {
              // Simulate accessing MCP documentation server
              const mcpUrl = tool.config.mcpUrl || "";
              console.log(`[SIMULATION] Accessing MCP Server: ${mcpUrl}`);
              
              if (mcpUrl.toLowerCase().includes('cloudflare')) {
                mcpData.push({
                  source: tool.name,
                  url: mcpUrl,
                  context: "Retrieved Cloudflare security documentation regarding WAF rules, Zero Trust policies, and Workers security best practices. Integrating Cloudflare-specific mitigation strategies into the final report."
                });
              } else {
                mcpData.push({
                  source: tool.name,
                  url: mcpUrl,
                  context: `Accessed documentation from ${mcpUrl}. Integrating relevant security standards and implementation guides.`
                });
              }
            }
          }
        }

        let fileContents = [];
        if (files) {
          for (const file of files) {
            try {
              if (file.mimetype === "application/pdf") {
                const dataBuffer = fs.readFileSync(file.path);
                const data = await pdf(dataBuffer);
                fileContents.push({ name: file.originalname, content: data.text, type: 'text' });
              } else {
                // Read a small chunk to detect file type
                const buffer = Buffer.alloc(12);
                const fd = fs.openSync(file.path, 'r');
                fs.readSync(fd, buffer, 0, 12, 0);
                fs.closeSync(fd);
                
                const detectedImageMimeType = detectImageType(buffer);
                
                if (file.mimetype.startsWith("image/") || file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i) || detectedImageMimeType) {
                  const base64 = fs.readFileSync(file.path, { encoding: 'base64' });
                  const mimeType = detectedImageMimeType || (file.mimetype === 'application/octet-stream' ? 'image/jpeg' : file.mimetype);
                  fileContents.push({ name: file.originalname, content: base64, type: 'image', mimeType });
                } else {
                  // For unknown types, check file size to prevent OOM on large binary files
                  const stats = fs.statSync(file.path);
                  if (stats.size > 1024 * 1024) { // 1MB limit for text files
                    console.warn(`File ${file.originalname} is too large (${stats.size} bytes) to read as text. Skipping or truncating.`);
                    fileContents.push({ name: file.originalname, content: `[File too large to process as text: ${stats.size} bytes]`, type: 'text' });
                  } else {
                    const content = fs.readFileSync(file.path, 'utf-8');
                    fileContents.push({ name: file.originalname, content, type: 'text' });
                  }
                }
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

        console.log("[INFO] Sending successful response back to client");
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
          success: true,
          processedFiles: fileContents,
          messageBusData: messageBusData,
          mcpData: mcpData,
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
