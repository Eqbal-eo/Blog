import { expect, test } from "@playwright/test";

// These tests only submit invalid data, so nothing is written to the database.

// Form messages live in <main>; Next.js also renders an empty route
// announcer with role="alert", so scope the lookup.
const formAlert = (page: import("@playwright/test").Page) => page.locator("main").getByRole("alert");

// Wait for React to hydrate so typed input reaches the form's handlers
async function open(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test.describe("access control", () => {
  for (const path of ["/dashboard", "/dashboard/posts/new", "/admin/posts", "/admin/comments"]) {
    test(`${path} requires sign-in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/%/g, "%")}`));
    });
  }

  test("old Express URLs redirect", async ({ request }) => {
    const res = await request.get("/posts/create", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toBe("/dashboard/posts/new");
  });
});

test.describe("forms", () => {
  test("login rejects wrong credentials", async ({ page }) => {
    await open(page, "/login");
    await page.getByLabel("اسم المستخدم").fill("no-such-user-e2e");
    await page.getByLabel("كلمة المرور").fill("wrong-password-123");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();
    await expect(formAlert(page)).toHaveText("اسم المستخدم أو كلمة المرور غير صحيحة");
  });

  test("blog request validates every field and keeps input", async ({ page }) => {
    await open(page, "/blog-request");
    await page.getByLabel("نص المقال").fill("نص قصير لا يكفي");
    await expect(page.getByText("٤ من ٣٠٠ كلمة على الأقل")).toBeVisible();
    await page.getByRole("button", { name: "إرسال الطلب" }).click();
    await expect(formAlert(page).first()).toBeVisible();
    await expect(page.locator("#sample_content-error")).toContainText("300 كلمة");
    await expect(page.getByLabel("نص المقال")).toHaveValue("نص قصير لا يكفي");
  });

  test("forgot password never reveals whether an account exists", async ({ page }) => {
    await open(page, "/forgot-password");
    await page.getByLabel("البريد الإلكتروني").fill(`nobody-${Date.now()}@example.invalid`);
    await page.getByRole("button", { name: "أرسل الرابط" }).click();
    // Either the neutral "if it exists" message or, after many runs, the
    // rate-limit message: neither says whether the account exists
    await expect(page.locator("main [role=status], main [role=alert]").first()).toContainText(
      /إن كان هذا البريد مرتبطاً بحساب|طلبات كثيرة/,
    );
  });

  test("reset link without a token is rejected", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("الرابط ناقص أو غير صالح")).toBeVisible();
  });

  test("register rejects an unknown invite code", async ({ page }) => {
    await open(page, "/register");
    await page.getByLabel("اسم المستخدم").fill("e2e_user");
    await page.getByLabel("البريد الإلكتروني").fill("e2e@example.invalid");
    await page.getByLabel("كود التفعيل").fill("WRONG234");
    await page.getByRole("button", { name: "إكمال التسجيل" }).click();
    // After several local runs the per-IP registration limit answers instead
    await expect(formAlert(page)).toHaveText(
      /كود التفعيل أو البريد الإلكتروني غير صحيح|تجاوزت الحد المسموح به لمحاولات التسجيل/,
    );
  });
});
