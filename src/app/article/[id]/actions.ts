"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_BLOCKED_MESSAGE, isDemoUser } from "@/lib/demo";
import { rateLimit } from "@/lib/rate-limit";
import { isBot, visitorKey } from "@/lib/visitor";
import { errorState, fieldErrors, formValues, type FormState } from "@/lib/forms";
import { HONEYPOT_MESSAGE, honeypotFilled } from "@/lib/honeypot";

/** Counts one view of a post (at most once per visitor every 6 hours). */
export async function recordView(postId: string): Promise<void> {
  if (!/^\d{1,12}$/.test(postId) || (await isBot())) return;
  const { error } = await supabase.rpc("record_post_view", {
    p_post_id: Number(postId),
    p_visitor: await visitorKey(),
  });
  // PGRST202 = function missing (migration not run yet): stay quiet
  if (error && error.code !== "PGRST202") console.error("View not recorded:", error.message);
}

const commentSchema = z.object({
  author_name: z.string().trim().min(2, "أدخل اسمك").max(80, "الاسم طويل جداً"),
  author_email: z
    .union([z.literal(""), z.email("أدخل بريداً صحيحاً أو اتركه فارغاً").max(200)])
    .optional()
    .default(""),
  body: z.string().trim().min(2, "اكتب تعليقك").max(3000, "التعليق أطول من 3000 حرف"),
});

export async function submitComment(postId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  if (!/^\d{1,12}$/.test(postId)) return errorState("التدوينة غير موجودة");

  if (honeypotFilled(formData)) return errorState(HONEYPOT_MESSAGE, values);

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", values, fieldErrors(parsed.error));
  }

  if (!(await rateLimit(`comment:${await visitorKey()}`, 5, 10 * 60))) {
    return errorState("أرسلت تعليقات كثيرة خلال وقت قصير، حاول بعد قليل.", values);
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", Number(postId))
    .eq("status", "published")
    .maybeSingle();
  if (!post) return errorState("التدوينة غير موجودة");

  // Admins' comments skip moderation; the demo account can't comment
  const user = await getCurrentUser();
  if (isDemoUser(user)) return errorState(DEMO_BLOCKED_MESSAGE, values);
  const approved = user?.role === "admin";

  const { error } = await supabase.from("comments").insert([
    {
      post_id: Number(postId),
      author_name: parsed.data.author_name,
      author_email: parsed.data.author_email || null,
      body: parsed.data.body,
      status: approved ? "approved" : "pending",
    },
  ]);

  if (error) {
    console.error("Comment not saved:", error.message);
    return errorState("تعذّر إرسال التعليق، حاول مرة أخرى", values);
  }

  if (approved) {
    updateTag(`comments-${postId}`);
    return { status: "success", message: "تم نشر تعليقك." };
  }
  updateTag("comments-pending");
  return { status: "success", message: "شكراً! سيظهر تعليقك بعد مراجعته." };
}
