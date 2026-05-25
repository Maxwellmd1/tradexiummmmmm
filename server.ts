import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial support for JSON body parsing
  app.use(express.json());

  // API Route: Reset Password Bypass (executed context-free on backend server to avoid ad-blockers)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email address is required." });
      }

      // Read current Firebase configuration for API key integrity
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (!fs.existsSync(configPath)) {
        return res.status(500).json({ error: "Firebase configuration file was not found on server storage." });
      }

      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const apiKey = config.apiKey;

      if (!apiKey) {
        return res.status(500).json({ error: "Firebase API Key is missing inside config store." });
      }

      // Send password reset request using Google's direct identity toolkit service
      const googleIdentityUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
      const response = await fetch(googleIdentityUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email: email.trim(),
        }),
      });

      const responseData: any = await response.json();

      if (!response.ok) {
        const errMessage = responseData.error?.message || "Unknown Auth API Exception";
        console.error("Firebase REST Auth error response:", responseData);
        return res.status(response.status).json({ 
          error: errMessage,
          code: responseData.error?.errors?.[0]?.reason || "rest_error"
        });
      }

      // Return success payload
      return res.status(200).json({ 
        success: true, 
        message: "Email reset dispatched successfully.",
        email: responseData.email
      });
    } catch (error: any) {
      console.error("Server API processing error:", error);
      return res.status(500).json({ error: error.message || "Failed to process SMTP relay bypass." });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Serve Front-end App via Vite Middleware (Development) or Static Serve (Production)
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
    console.log(`[Tradexium Server] Service listening on port ${PORT} (Mode: ${process.env.NODE_ENV || "development"})`);
  });
}

startServer();
