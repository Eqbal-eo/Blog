import { describe, expect, it } from "vitest";
import { excerpt, sanitize } from "@/lib/sanitize";

describe("sanitize", () => {
  it("removes scripts, event handlers and javascript: links", () => {
    const html = sanitize(
      '<p onclick="x()">hi<script>alert(1)</script></p><img src=x onerror="alert(2)"><a href="javascript:alert(3)">a</a>',
    );
    expect(html).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(html).toContain("<p>hi</p>");
  });

  it("keeps editor formatting", () => {
    const html = sanitize(
      '<h2>عنوان</h2><p style="text-align: center" dir="rtl"><strong>غامق</strong></p><blockquote>اقتباس</blockquote><pre><code>x</code></pre>',
    );
    expect(html).toContain("<h2>عنوان</h2>");
    expect(html).toContain("text-align:center");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("<strong>غامق</strong>");
    expect(html).toContain("<blockquote>");
  });

  it("keeps Quill classes from older posts but drops other classes", () => {
    const html = sanitize('<p class="ql-align-center evil-class">x</p>');
    expect(html).toBe('<p class="ql-align-center">x</p>');
  });

  it("forces safe rel on links", () => {
    expect(sanitize('<a href="https://example.com" target="_blank">x</a>')).toContain(
      'rel="noopener noreferrer nofollow"',
    );
  });

  it("drops iframes and protocol-relative URLs", () => {
    const html = sanitize('<iframe src="https://evil.example"></iframe><a href="//evil.example">x</a>');
    expect(html).not.toContain("iframe");
    expect(html).not.toContain("href");
    expect(html).toContain(">x</a>");
  });

  it("handles empty input", () => {
    expect(sanitize(null)).toBe("");
    expect(sanitize(undefined)).toBe("");
  });
});

describe("excerpt", () => {
  it("returns plain text with block boundaries kept apart", () => {
    expect(excerpt("<h2>مقدمة</h2><p>نص&nbsp;التدوينة</p>")).toBe("مقدمة نص التدوينة");
  });

  it("truncates with an ellipsis", () => {
    const text = excerpt(`<p>${"كلمة ".repeat(100)}</p>`, 20);
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBeLessThanOrEqual(21);
  });
});
