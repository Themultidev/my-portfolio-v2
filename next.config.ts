import type { NextConfig } from "next";
import { getAuthConfig } from "./src/lib/auth-env";
import { getDatabaseUrl } from "./src/lib/database-url";
import { blobStorageEnabled } from "./src/lib/storage-config";

// Fail startup when private authentication settings are incomplete.
// Next.js loads .env/.env.local before evaluating this configuration.
getAuthConfig();
if (process.env.VERCEL === "1") {
  getDatabaseUrl();
  blobStorageEnabled();
}

const config: NextConfig = {
  // Keep the existing public EmailJS values working during the migration.
  env: {
    NEXT_PUBLIC_EMAILJS_SERVICE_ID:
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ??
      process.env.VITE_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID:
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ??
      process.env.VITE_EMAILJS_TEMPLATE_ID,
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ??
      process.env.VITE_EMAILJS_PUBLIC_KEY,
  },
};

export default config;
