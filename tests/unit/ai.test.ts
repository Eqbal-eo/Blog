import { beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for the Anthropic SDK: records the request, returns a canned reply
const parse = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status = 500;
  }
  class RateLimitError extends APIError {}
  class AuthenticationError extends APIError {}
  class Anthropic {
    static APIError = APIError;
    static RateLimitError = RateLimitError;
    static AuthenticationError = AuthenticationError;
    beta = { messages: { parse } };
  }
  return { default: Anthropic };
});

const { AiError, proofread, suggestMeta } = await import("@/lib/ai");

const reply = (parsed_output: unknown, stop_reason = "end_turn") => ({ parsed_output, stop_reason });

beforeEach(() => parse.mockReset());

describe("proofread", () => {
  const text = "ذهبت الى المدرسه صباحا";

  it("keeps only corrections whose original text is really in the draft", async () => {
    parse.mockResolvedValue(
      reply({
        corrections: [
          { original: "الى", suggestion: "إلى", reason: "همزة" },
          { original: "المدرسه", suggestion: "المدرسة", reason: "تاء مربوطة" },
          { original: "غير موجود", suggestion: "x", reason: "?" }, // hallucinated
          { original: "صباحا", suggestion: "صباحا", reason: "no-op" }, // no change
        ],
      }),
    );
    const result = await proofread(text);
    expect(result.map((c) => c.suggestion)).toEqual(["إلى", "المدرسة"]);
  });

  it("sends the draft with fallbacks, structured output and medium effort", async () => {
    parse.mockResolvedValue(reply({ corrections: [] }));
    await proofread(text);
    const request = parse.mock.calls[0][0];
    expect(request.model).toBe("claude-opus-5-5");
    expect(request.betas).toContain("server-side-fallback-2026-07-01");
    expect(request.fallbacks).toBe("default");
    expect(request.output_config.effort).toBe("medium");
    expect(request.output_config.format).toBeTruthy();
    expect(request.messages[0].content).toContain(text);
  });

  it("turns a refusal into a friendly error", async () => {
    parse.mockResolvedValue(reply(null, "refusal"));
    await expect(proofread(text)).rejects.toBeInstanceOf(AiError);
  });

  it("reports a truncated answer instead of returning partial data", async () => {
    parse.mockResolvedValue(reply(null, "max_tokens"));
    await expect(proofread(text)).rejects.toThrow("طويل");
  });
});

describe("suggestMeta", () => {
  it("returns at most three trimmed titles and a capped description", async () => {
    parse.mockResolvedValue(
      reply({
        titles: [" عنوان أول ", "عنوان ثانٍ", "", "عنوان ثالث", "عنوان رابع"],
        description: "و".repeat(400),
      }),
    );
    const result = await suggestMeta("", "نص التدوينة");
    expect(result.titles).toEqual(["عنوان أول", "عنوان ثانٍ", "عنوان ثالث"]);
    expect(result.description).toHaveLength(300);
    expect(parse.mock.calls[0][0].output_config.effort).toBe("low");
  });
});
