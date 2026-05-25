import fs from "fs";
import path from "path";

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email address is required." });
    }

    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      return res.status(500).json({ error: "Firebase configuration file was not found on server storage." });
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apiKey = config.apiKey;

    if (!apiKey) {
      return res.status(500).json({ error: "Firebase API Key is missing inside config store." });
    }

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

    return res.status(200).json({ 
      success: true, 
      message: "Email reset dispatched successfully.",
      email: responseData.email
    });
  } catch (error: any) {
    console.error("Server API processing error:", error);
    return res.status(500).json({ error: error.message || "Failed to process SMTP relay bypass." });
  }
}
