import { describe, expect, it } from "vitest";
import {
  categoryLabel,
  isPostCategory,
  postsCount,
  readingMinutes,
  readingTimeLabel,
  wordCount,
} from "@/lib/format";
import { normalizeArabic } from "@/lib/search";
import { toEditorHtml } from "@/lib/editor-html";
import { generateInviteCode } from "@/lib/invite-code";

describe("normalizeArabic (must match public.normalize_ar in Postgres)", () => {
  it("strips diacritics and tatweel", () => {
    expect(normalizeArabic("صلابةٌ هَشّة")).toBe("صلابه هشه");
    expect(normalizeArabic("كـــتاب")).toBe("كتاب");
  });

  it("unifies alef, yaa and taa marbuta forms", () => {
    expect(normalizeArabic("إسرائيل أحمد آفاق")).toBe("اسرائيل احمد افاق");
    expect(normalizeArabic("مستشفى مدرسة")).toBe("مستشفي مدرسه");
  });

  it("collapses whitespace and caps length", () => {
    expect(normalizeArabic("  كلمة   أخرى  ")).toBe("كلمه اخري");
    expect(normalizeArabic("ا".repeat(500))).toHaveLength(200);
  });
});

describe("format helpers", () => {
  it("counts words in HTML", () => {
    expect(wordCount("<p>واحد اثنان</p><p>ثلاثة</p>")).toBe(3);
    expect(wordCount("")).toBe(0);
  });

  it("estimates reading time, ignoring embedded images", () => {
    expect(readingMinutes(`<p>${"كلمة ".repeat(1000)}</p>`)).toBe(5);
    expect(readingMinutes(`<img src="data:image/png;base64,${"A".repeat(5000)}">`)).toBe(1);
  });

  it("uses correct Arabic plural forms", () => {
    expect(readingTimeLabel(1)).toBe("دقيقة قراءة");
    expect(readingTimeLabel(2)).toBe("دقيقتا قراءة");
    expect(postsCount(0)).toBe("لا تدوينات بعد");
    expect(postsCount(2)).toBe("تدوينتان");
  });

  it("maps category codes to Arabic labels", () => {
    expect(categoryLabel("politics")).toBe("سياسة");
    expect(categoryLabel("unknown")).toBe("unknown");
    expect(isPostCategory("history")).toBe(true);
    expect(isPostCategory("culture")).toBe(false); // request-only category
  });
});

describe("toEditorHtml", () => {
  it("turns Quill alignment classes into the style Tiptap reads", () => {
    expect(toEditorHtml('<p class="ql-align-center">x</p>')).toBe('<p style="text-align: center">x</p>');
    expect(toEditorHtml('<h2 class="ql-direction-rtl ql-align-right">x</h2>')).toBe(
      '<h2 style="text-align: right" class="ql-direction-rtl">x</h2>',
    );
  });
});

describe("invite codes", () => {
  it("are 8 characters without look-alike letters", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateInviteCode()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    }
  });
});
