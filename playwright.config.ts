import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/migration",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4100 --strictPort",
      url: "http://127.0.0.1:4100",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command:
        "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ADMIN_EMAIL: "parity-only@example.invalid",
        ADMIN_PASSWORD: "parity-only-password",
        SESSION_SECRET: "parity-only-session-secret-at-least-32-bytes",
        APP_ORIGIN: "http://127.0.0.1:3100",
        DATABASE_URL: "file:./dev.db",
      },
    },
  ],
});
