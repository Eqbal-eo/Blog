import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import * as templates from "@/lib/email/templates";

const url = "https://example.com/link";
const fullName = "كاتب";

const emails = {
  invite: templates.InviteCodeEmail({ fullName, specialty: "أدب", inviteCode: "ABCD2345", registerUrl: url }),
  rejected: templates.RequestRejectedEmail({ fullName, reason: "النص قصير." }),
  request: templates.NewRequestEmail({
    fullName,
    email: "writer@example.com",
    specialty: "أدب",
    experienceYears: 2,
    sampleTitle: "عنوان",
    sampleCategory: "أدب",
    sampleExcerpt: "مقتطف.",
    motivation: "أحب الكتابة.",
    reviewUrl: url,
  }),
  account: templates.LoginCredentialsEmail({ fullName, username: "writer", tempPassword: "not-real-1", loginUrl: url }),
  confirm: templates.ConfirmSubscriptionEmail({ scope: "كل التدوينات الجديدة", confirmUrl: url }),
  post: templates.NewPostEmail({ title: "عنوان", authorName: fullName, excerpt: "مقتطف.", postUrl: url, unsubscribeUrl: url }),
  reset: templates.PasswordResetEmail({ fullName, username: "writer", resetUrl: url }),
};

describe("emails read right to left in Gmail", () => {
  it.each(Object.entries(emails))("%s", async (_name, element) => {
    const html = await render(element);
    // What is left once Gmail drops the attributes of <html> and <body>
    const inside = html.replace(/<(html|body)\b[^>]*>/gi, "<$1>");
    const container = inside.match(/<table\b[^>]*max-width:560px[^>]*>/i)?.[0] ?? "";

    expect(container).toContain('dir="rtl"');
    expect(container).toContain("direction:rtl");
    for (const [block] of inside.matchAll(/<(?:p|h1)\s[^>]*>/gi)) {
      expect(block).toMatch(/text-align:(right|center)/);
    }
  });
});
