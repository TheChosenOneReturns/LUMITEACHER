import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5173",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run dev -w @story-teacher/backend",
      url: "http://127.0.0.1:3000/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npm run dev -w @story-teacher/frontend -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173/login",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
