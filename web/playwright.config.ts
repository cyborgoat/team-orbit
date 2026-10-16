import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/integration/**",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:5173",
    ...(process.env.PLAYWRIGHT_CHROME ? { channel: "chrome" } : {}),
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    env: {
      API_PROXY_TARGET: process.env.API_PROXY_TARGET || "http://127.0.0.1:3000",
    },
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
