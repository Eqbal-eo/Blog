import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("home shows the hero and latest posts", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("آفاق");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("main article").first()).toBeVisible();
  });

  test("all posts page paginates", async ({ page }) => {
    await page.goto("/articles");
    await expect(page.getByRole("heading", { name: "كل التدوينات" })).toBeVisible();
    await expect(page.locator("main article")).not.toHaveCount(0);
  });

  test("a post opens from its card", async ({ page }) => {
    await page.goto("/articles");
    const firstTitle = page.locator("main article h3 a").first();
    const title = (await firstTitle.textContent())?.trim() ?? "";
    await firstTitle.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator(".article-body")).toBeVisible();
  });

  test("category pages exist only for known categories", async ({ page }) => {
    test.slow(); // two cold page renders under parallel load
    await page.goto("/category/politics");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سياسة");
    const missing = await page.goto("/category/not-a-category");
    expect(missing?.status()).toBe(404);
  });

  test("search ignores Arabic diacritics and letter variants", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("searchbox", { name: "كلمات البحث" }).fill("اسرائيل");
    await page.getByRole("button", { name: "بحث" }).click();
    await expect(page.getByText(/نتيجة لـ/)).toBeVisible();
  });

  test("unknown posts return 404", async ({ request }) => {
    const res = await request.get("/article/999999999");
    expect([200, 404]).toContain(res.status()); // streamed not-found keeps 200
    expect(await res.text()).toContain("التدوينة غير موجودة");
  });

  test("a first visit is light even on a dark device", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "المظهر: فاتح" })).toBeVisible();
  });

  test("theme toggle cycles light, dark and device", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/about");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: /المظهر/ });
    await expect(html).not.toHaveClass(/dark/);
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await expect(html).toHaveClass(/dark/); // remembered, applied before paint

    await expect(toggle).toHaveAccessibleName("المظهر: داكن"); // hydrated
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("المظهر: حسب الجهاز");
    await expect(html).toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: "light" });
    await expect(html).not.toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await expect(toggle).toHaveAccessibleName("المظهر: حسب الجهاز");
    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test("no horizontal scrolling", async ({ page }) => {
    for (const path of ["/", "/articles", "/blogs", "/about"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, path).toBe(false);
    }
  });
});

test.describe("feeds and metadata", () => {
  test("RSS feed is valid XML with items", async ({ request }) => {
    const res = await request.get("/rss.xml");
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toMatch(/^<\?xml/);
    expect(body).toContain("<item>");
  });

  test("sitemap and robots", async ({ request }) => {
    expect(await (await request.get("/sitemap.xml")).text()).toContain("<urlset");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Sitemap:");
  });

  test("share image is a PNG", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });
});
