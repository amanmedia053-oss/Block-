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
      let apiKey = process.env.GEMINI_API_KEY;
      
      // Fallback to the working free API key provided by the user in chat if not configured in Secrets
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        apiKey = "AIzaSyBaS4dSWUPKZEwkrfbsE7sLA9BkHfE8EFQ";
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

      // Enable Google Search Grounding to let AI fetch real-time templates/data from the internet
      const finalConfig = { ...config };
      if (!finalConfig.tools) {
        finalConfig.tools = [{ googleSearch: {} }];
      } else if (!finalConfig.tools.some((t: any) => t.googleSearch)) {
        finalConfig.tools.push({ googleSearch: {} });
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: finalConfig
      });
      
      if (!response || !response.text) {
        console.error("Gemini API returned an invalid response:", JSON.stringify(response));
        throw new Error("The AI service returned an empty or invalid response. Please check your API key permissions.");
      }
      
      console.log("AI Content generated successfully with internet grounding");
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Detailed AI Generation Error:", error);
      
      let statusCode = 500;
      if (typeof error.status === 'number' && error.status >= 100 && error.status < 600) {
        statusCode = error.status;
      } else if (typeof error.status === 'string' && !isNaN(parseInt(error.status))) {
        const parsed = parseInt(error.status);
        if (parsed >= 100 && parsed < 600) {
          statusCode = parsed;
        }
      }
      
      const message = error.message || "An error occurred with the AI service";
      
      res.status(statusCode).json({ 
        error: message,
        details: error.details,
        suggestion: "Please ensure your Gemini API key is correctly set in the AI Studio Settings > Secrets panel."
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
