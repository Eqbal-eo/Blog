"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { TRIAL_PER_SITE, TRIAL_PER_WRITER } from "@/lib/ai-trial";
import {
  AiError,
  aiAvailable,
  MAX_INPUT_CHARS,
  proofread,
  suggestMeta,
  type Correction,
  type MetaSuggestions,
} from "@/lib/ai";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

const DAY = 24 * 60 * 60;

async function guard(text: string): Promise<string | null> {
  const user = await requireUser();
  if (!aiAvailable()) return "مساعد الكتابة غير مفعّل على هذا الموقع.";

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 20) return "اكتب 20 كلمة على الأقل قبل استخدام المساعد.";
  if (text.length > MAX_INPUT_CHARS) return "النص أطول من حد المساعد، جرّب جزءاً منه.";

  // The writer first, so someone over their limit doesn't use up the site's
  const costly = { failClosed: true };
  if (!(await rateLimit(`ai:trial:user:${user.id}`, TRIAL_PER_WRITER, DAY, costly))) {
    return "وصلت إلى حد الطلبات في النسخة التجريبية، حاول بعد 24 ساعة.";
  }
  if (!(await rateLimit("ai:trial:site", TRIAL_PER_SITE, DAY, costly))) {
    return "انتهت طلبات النسخة التجريبية المتاحة اليوم على المنصة، حاول لاحقاً.";
  }
  return null;
}

/** Arabic spelling, grammar and punctuation corrections for a draft. */
export async function proofreadDraft(text: string): Promise<Result<Correction[]>> {
  const problem = await guard(text);
  if (problem) return { ok: false, message: problem };
  try {
    return { ok: true, data: await proofread(text) };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, message: error.message };
    console.error("Proofreading failed:", error);
    return { ok: false, message: "حدث خطأ غير متوقع، حاول مرة أخرى." };
  }
}

/** Three title ideas and a search/preview summary for a draft. */
export async function suggestTitleAndSummary(title: string, text: string): Promise<Result<MetaSuggestions>> {
  const problem = await guard(text);
  if (problem) return { ok: false, message: problem };
  try {
    return { ok: true, data: await suggestMeta(title.slice(0, 300), text) };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, message: error.message };
    console.error("Title suggestions failed:", error);
    return { ok: false, message: "حدث خطأ غير متوقع، حاول مرة أخرى." };
  }
}
