import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests run against a production build (`npm run build` first).
 * They only read data and submit invalid forms, so they never change the
 * database. Locally they use the installed Chrome; CI installs Chromium.
 */
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  // First renders hit the database cold; give them room
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "ar",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: process.env.CI ? undefined : "chrome" },
    },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}/about`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Never send real email from test runs
    env: { BREVO_USER: "", BREVO_SMTP_KEY: "", ADMIN_EMAIL: "" },
  },
});
