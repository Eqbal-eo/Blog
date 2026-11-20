"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendPasswordReset } from "@/lib/email";
import { createResetToken, findAccountByEmail, verifyResetToken } from "@/lib/password-reset";
import { errorState, fieldErrors, formValues, type FormState } from "@/lib/forms";

const SENT_MESSAGE =
  "إن كان هذا البريد مرتبطاً بحساب، فستصلك رسالة فيها رابط لتعيين كلمة مرور جديدة خلال دقائق.";

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const email = z.email("أدخل بريداً إلكترونياً صحيحاً").trim().toLowerCase().safeParse(formData.get("email"));
  if (!email.success) return errorState(email.error.issues[0].message, values);

  const ip = await clientIp();
  const allowed =
    (await rateLimit(`reset:ip:${ip}`, 5, 60 * 60)) && (await rateLimit(`reset:email:${email.data}`, 3, 60 * 60));
  if (!allowed) return errorState("طلبات كثيرة، حاول بعد ساعة.", values);

  const account = await findAccountByEmail(email.data);
  if (account) {
    const token = await createResetToken(String(account.id), account.password);
    after(() =>
      sendPasswordReset(email.data, {
        fullName: account.display_name_ar || account.username,
        username: account.username,
        token,
      }),
    );
  }

  // Same answer either way, so the form can't reveal who has an account
  return { status: "success", message: SENT_MESSAGE };
}

const newPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(10, "كلمة المرور 10 أحرف على الأقل")
      .max(200)
      .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "استخدم حروفاً وأرقاماً معاً"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ["confirm_password"],
    message: "كلمتا المرور غير متطابقتين",
  });

export async function resetPassword(token: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", undefined, fieldErrors(parsed.error));
  }

  if (!(await rateLimit(`reset-submit:${await clientIp()}`, 10, 60 * 60))) {
    return errorState("محاولات كثيرة، حاول بعد ساعة.");
  }

  const userId = await verifyResetToken(token);
  if (!userId) {
    return errorState("الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.");
  }

  const { error } = await supabase
    .from("users")
    .update({ password: await bcrypt.hash(parsed.data.new_password, 12) })
    .eq("id", Number(userId));
  if (error) return errorState("تعذّر تغيير كلمة المرور، حاول مرة أخرى.");

  redirect("/login?reset=1");
}
