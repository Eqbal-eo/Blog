"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { visitorKey } from "@/lib/visitor";
import { subscribe } from "@/lib/newsletter";
import { errorState, formValues, type FormState } from "@/lib/forms";
import { HONEYPOT_MESSAGE, honeypotFilled } from "@/lib/honeypot";

const emailSchema = z.email("أدخل بريداً إلكترونياً صحيحاً").trim().toLowerCase().max(200);

export async function subscribeToNewsletter(
  authorId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return errorState(email.error.issues[0].message, values);
  if (honeypotFilled(formData)) return errorState(HONEYPOT_MESSAGE, values);

  if (!(await rateLimit(`subscribe:${await visitorKey()}`, 5, 60 * 60))) {
    return errorState("محاولات كثيرة، حاول بعد ساعة.", values);
  }

  let author: { id: string; name: string } | null = null;
  if (authorId !== null) {
    if (!/^\d{1,12}$/.test(authorId)) return errorState("الكاتب غير موجود");
    const { data } = await supabase
      .from("users")
      .select("id, username, display_name_ar")
      .eq("id", Number(authorId))
      .maybeSingle();
    if (!data) return errorState("الكاتب غير موجود");
    author = { id: String(data.id), name: data.display_name_ar || data.username };
  }

  try {
    const result = await subscribe(email.data, author);
    return {
      status: "success",
      message: result.alreadyConfirmed
        ? "أنت مشترك بالفعل بهذا البريد."
        : "أرسلنا رابط تأكيد إلى بريدك، اضغطه لإتمام الاشتراك.",
    };
  } catch (error) {
    console.error("Subscription failed:", error);
    return errorState("تعذّر الاشتراك حالياً، حاول لاحقاً.", values);
  }
}

const tokenSchema = z.string().min(20).max(100);

export async function confirmSubscription(token: string) {
  const parsed = tokenSchema.safeParse(token);
  if (parsed.success) {
    const { data } = await supabase
      .from("subscribers")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("token", parsed.data)
      .is("confirmed_at", null)
      .select("id");
    if (data && data.length > 0) redirect("/newsletter/confirm?done=1");
  }
  redirect("/newsletter/confirm?done=0");
}

export async function unsubscribe(token: string) {
  const parsed = tokenSchema.safeParse(token);
  if (parsed.success) {
    await supabase.from("subscribers").delete().eq("token", parsed.data);
  }
  // Same outcome either way: the address no longer receives emails
  redirect("/newsletter/unsubscribe?done=1");
}
