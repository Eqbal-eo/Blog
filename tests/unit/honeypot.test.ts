import { beforeEach, describe, expect, it, vi } from "vitest";

const subscribe = vi.fn();
const rateLimit = vi.fn();
const insert = vi.fn();
const post = {
  select: () => post,
  eq: () => post,
  maybeSingle: async () => ({ data: { id: 5 } }),
};

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (table: string) => (table === "posts" ? post : { insert }) },
}));
vi.mock("@/lib/newsletter", () => ({ subscribe }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/visitor", () => ({ visitorKey: async () => "visitor", isBot: async () => false }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => null }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { subscribeToNewsletter } = await import("@/app/newsletter/actions");
const { submitComment } = await import("@/app/article/[id]/actions");
const { HONEYPOT_FIELD, HONEYPOT_MESSAGE } = await import("@/lib/honeypot");

const idle = { status: "idle" as const };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const signUp = (extra: Record<string, string>) =>
  subscribeToNewsletter(null, idle, form({ email: "reader@example.com", ...extra }));
const comment = (extra: Record<string, string>) =>
  submitComment("5", idle, form({ author_name: "قارئ", body: "تعليق جميل", ...extra }));

beforeEach(() => {
  vi.resetAllMocks();
  rateLimit.mockResolvedValue(true);
  subscribe.mockResolvedValue({ alreadyConfirmed: false });
  insert.mockResolvedValue({ error: null });
});

describe("hidden bot trap", () => {
  it("doesn't drop a subscriber whose browser filled a field named website", async () => {
    const result = await signUp({ website: "https://example.com" });

    expect(result.status).toBe("success");
    expect(subscribe).toHaveBeenCalledWith("reader@example.com", null);
  });

  it("doesn't drop a comment whose browser filled a field named website", async () => {
    const result = await comment({ website: "https://example.com", [HONEYPOT_FIELD]: "" });

    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("tells a caught subscriber that nothing was sent", async () => {
    const result = await signUp({ [HONEYPOT_FIELD]: "filled" });

    expect(result).toMatchObject({ status: "error", message: HONEYPOT_MESSAGE });
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("tells a caught commenter that nothing was sent", async () => {
    const result = await comment({ [HONEYPOT_FIELD]: "filled" });

    expect(result).toMatchObject({ status: "error", message: HONEYPOT_MESSAGE });
    expect(insert).not.toHaveBeenCalled();
  });
});
