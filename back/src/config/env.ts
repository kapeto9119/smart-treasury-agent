import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },

  workos: {
    apiKey: process.env.WORKOS_API_KEY || "",
    clientId: process.env.WORKOS_CLIENT_ID || "",
  },

  pythonService: {
    url: process.env.PYTHON_SERVICE_URL || "http://localhost:8000",
  },

  galileo: {
    apiKey: process.env.GALILEO_API_KEY || "",
    projectId: process.env.GALILEO_PROJECT_ID || "",
    consoleUrl:
      process.env.GALILEO_CONSOLE_URL || "https://console.rungalileo.io",
  },

  browserUse: {
    apiKey: process.env.BROWSER_USE_API_KEY || "",
  },

  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
      : ["http://localhost:3000", "https://*.railway.app"],
  },
};

// Validate required environment variables
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "ANTHROPIC_API_KEY",
  "PYTHON_SERVICE_URL",
];

export function validateEnv(): void {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missing.join(", ")}`
    );
    console.warn("⚠️  Some features may not work correctly.");
  }
}
