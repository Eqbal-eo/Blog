import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimit = vi.fn();
const proofread = vi.fn();
const suggestMeta = vi.fn();

vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ id: "7", username: "writer" }) }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/ai", () => ({
  AiError: class AiError extends Error {},
  aiAvailable: () => true,
  MAX_INPUT_CHARS: 30_000,
  proofread,
  suggestMeta,
}));

const { proofreadDraft, suggestTitleAndSummary } = await import("@/app/dashboard/ai-actions");
const { TRIAL_PER_SITE, TRIAL_PER_WRITER } = await import("@/lib/ai-trial");

const DAY = 24 * 60 * 60;
const draft = "كلمة ".repeat(25);
const closed = { failClosed: true };

beforeEach(() => {
  vi.resetAllMocks();
  proofread.mockResolvedValue([]);
  suggestMeta.mockResolvedValue({ titles: [], description: "" });
});

describe("writing assistant trial", () => {
  it("counts both tools against the same writer and site allowances", async () => {
    rateLimit.mockResolvedValue(true);
    await proofreadDraft(draft);
    await suggestTitleAndSummary("عنوان", draft);

    const writer = ["ai:trial:user:7", TRIAL_PER_WRITER, DAY, closed];
    const site = ["ai:trial:site", TRIAL_PER_SITE, DAY, closed];
    expect(rateLimit.mock.calls).toEqual([writer, site, writer, site]);
  });

  it("a writer over the limit doesn't spend the site's allowance or call the API", async () => {
    rateLimit.mockResolvedValue(false);
    const result = await proofreadDraft(draft);

    expect(result.ok).toBe(false);
    expect(rateLimit).toHaveBeenCalledTimes(1);
    expect(proofread).not.toHaveBeenCalled();
  });

  it("the site's limit stops the call", async () => {
    rateLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const result = await suggestTitleAndSummary("عنوان", draft);

    expect(result.ok).toBe(false);
    expect(suggestMeta).not.toHaveBeenCalled();
  });

  it("a draft that is too short uses no allowance", async () => {
    const result = await proofreadDraft("نص قصير");

    expect(result.ok).toBe(false);
    expect(rateLimit).not.toHaveBeenCalled();
  });
});
