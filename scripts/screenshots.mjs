// Captures the README screenshots from a running production build.
//
//   npm run build && npx next start -p 3100   (in another terminal)
//   node --env-file=.env scripts/screenshots.mjs
//
// Signs in with the public demo account for the dashboard shots.

import { mkdir } from "node:fs/promises";
import { chromium, devices } from "@playwright/test";

const BASE = process.env.SCREENSHOT_URL ?? "http://localhost:3100";
const OUT = "docs/screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: process.env.CI ? undefined : "chrome" });

async function shot(context, path, file, { dark = false, scroll = 0, prepare } = {}) {
  const page = await context.newPage();
  await page.goto(BASE + path);
  await page.waitForLoadState("networkidle");
  await page.evaluate((isDark) => {
    document.documentElement.classList.toggle("dark", isDark);
  }, dark);
  if (prepare) await prepare(page);
  if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${file}.png` });
  console.log("saved", file);
  await page.close();
}

const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: "ar" });
await shot(desktop, "/", "home");
await shot(desktop, "/articles", "articles");
const firstPost = await (async () => {
  const page = await desktop.newPage();
  await page.goto(BASE + "/articles");
  const href = await page.locator("main article h3 a").first().getAttribute("href");
  await page.close();
  return href;
})();
await shot(desktop, firstPost, "article-dark", { dark: true });

// Writer dashboard, signed in as the demo account
const page = await desktop.newPage();
await page.goto(BASE + "/login");
await page.waitForLoadState("networkidle");
await page.getByLabel("اسم المستخدم").fill("demo");
await page.getByLabel("كلمة المرور").fill(process.env.DEMO_PASSWORD ?? "");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();
await page.waitForURL("**/dashboard");
await page.close();

await shot(desktop, "/dashboard", "dashboard");
await shot(desktop, "/dashboard/posts", "posts");
const editorPage = await desktop.newPage();
await editorPage.goto(BASE + "/dashboard/posts");
const editHref = await editorPage.locator('a[href$="/edit"]').first().getAttribute("href");
await editorPage.close();
await shot(desktop, editHref, "editor");

const mobile = await browser.newContext({ ...devices["iPhone 13"], locale: "ar" });
await shot(mobile, "/", "mobile-home");
await shot(mobile, firstPost, "mobile-article", { dark: true });

await browser.close();
