import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, config } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      console.log("Generating AI content with prompt length:", prompt?.length);
      
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: config
      });
      
      if (!response.text) {
        console.error("Gemini API returned no text. Response object:", JSON.stringify(response));
        throw new Error("Empty response from Gemini API");
      }
      
      console.log("AI Content generated successfully");
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Detailed AI Generation Error:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        details: error.details
      });
      res.status(500).json({ 
        error: error.message || "An error occurred with the AI service",
        details: error.details 
      });
    }
  });

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
  });
}

startServer();
