import type { NextConfig } from "next";

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
