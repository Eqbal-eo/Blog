import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/*
 * Writing assistant for authors: Arabic proofreading and title / summary
 * suggestions. It never writes or rewrites the post itself: every change is
 * a suggestion the author accepts or ignores.
 */

const MODEL = "claude-opus-5-5";

// Re-runs a request on another model if this one declines it (refusal),
// routed by Anthropic per refusal category.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export const MAX_INPUT_CHARS = 30_000;

let client: Anthropic | null = null;

/** True when an Anthropic API key is configured. */
export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export class AiError extends Error {}

async function run<T extends z.ZodType>(
  schema: T,
  { system, prompt, effort, maxTokens }: { system: string; prompt: string; effort: "low" | "medium"; maxTokens: number },
): Promise<z.infer<T>> {
  try {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system,
      output_config: { effort, format: betaZodOutputFormat(schema) },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new AiError("تعذّر على المساعد معالجة هذا النص.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new AiError("النص طويل جداً على المساعد، جرّب جزءاً منه.");
    }
    return response.parsed_output as z.infer<T>;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("المساعد مشغول حالياً، حاول بعد دقيقة.");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key rejected");
      throw new AiError("المساعد غير متاح حالياً.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      throw new AiError("تعذّر الاتصال بالمساعد، حاول مرة أخرى.");
    }
    throw error;
  }
}

// ------------------------------------------------------------ proofreading

const ProofreadSchema = z.object({
  corrections: z.array(
    z.object({
      original: z.string(),
      suggestion: z.string(),
      reason: z.string(),
    }),
  ),
});

export type Correction = z.infer<typeof ProofreadSchema>["corrections"][number];

const PROOFREAD_SYSTEM = `You are a careful Arabic copy editor for an Arabic blogging platform of cultural, intellectual and political essays.

Find clear errors in the author's text: spelling, hamza placement (أ/إ/ا/ء/ئ/ؤ), taa marbuta vs haa (ة/ه), alef maqsura vs yaa (ى/ي), grammar (agreement, case endings that are written out, verb forms), and punctuation (Arabic comma ، and question mark ؟, spacing around punctuation).

Rules:
- Only report real errors. Do not change word choice, style, tone, dialect or the author's voice. Do not rephrase sentences. Do not add or remove ideas.
- "original" must be copied exactly, character for character, from the text, and be as short as possible while still unique: usually the single misspelled word, or two to four words when context is needed. Never span a line break.
- "suggestion" replaces "original" exactly and differs only by the fix.
- "reason" is a short explanation in Arabic (under 12 words).
- Report each distinct error once, in the order it appears. At most 40 corrections.
- If the text has no clear errors, return an empty list.`;

export async function proofread(text: string): Promise<Correction[]> {
  const result = await run(ProofreadSchema, {
    system: PROOFREAD_SYSTEM,
    prompt: `<text>\n${text}\n</text>`,
    effort: "medium",
    maxTokens: 8000,
  });
  // Keep only well-formed, real changes that actually occur in the text
  return result.corrections
    .filter((c) => c.original && c.original !== c.suggestion && text.includes(c.original))
    .slice(0, 40);
}

// ------------------------------------------------ title and summary ideas

const MetaSchema = z.object({
  titles: z.array(z.string()),
  description: z.string(),
});

export type MetaSuggestions = z.infer<typeof MetaSchema>;

const META_SYSTEM = `You help Arabic writers present their essays. Given a draft, suggest:
- "titles": exactly 3 alternative Arabic titles. Faithful to the essay's actual argument, specific, no clickbait, no exclamation marks, at most 12 words each. Vary the approach (direct, thought-provoking, evocative).
- "description": one Arabic summary sentence for search engines and link previews, 120 to 160 characters, stating what the essay argues. No hashtags, no quotes around it.
Write in Modern Standard Arabic matching the essay's register.`;

export async function suggestMeta(title: string, text: string): Promise<MetaSuggestions> {
  const result = await run(MetaSchema, {
    system: META_SYSTEM,
    prompt: `<current_title>${title || "(none)"}</current_title>\n<essay>\n${text}\n</essay>`,
    effort: "low",
    maxTokens: 2000,
  });
  return {
    titles: result.titles.map((t) => t.trim()).filter(Boolean).slice(0, 3),
    description: result.description.trim().slice(0, 300),
  };
}
