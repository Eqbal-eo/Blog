"use server";

import { randomInt } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { createSession, deleteSession } from "@/lib/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { errorState, fieldErrors, formValues, type FormState } from "@/lib/forms";
import { notifyAdminNewRequest, sendLoginCredentials } from "@/lib/email";
import { REQUEST_CATEGORIES, wordCount } from "@/lib/format";
import { DEMO_USERNAME, isClosedDemoAccount } from "@/lib/demo";

// ---------------------------------------------------------------- login

const loginSchema = z.object({
  username: z.string().trim().min(1, "أدخل اسم المستخدم"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

let dummy: Promise<string> | undefined;
function dummyHash(): Promise<string> {
  dummy ??= bcrypt.hash("not-a-real-password", 10);
  return dummy;
}

/** Only same-site relative paths, so ?next= can't redirect off-site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  delete values.password;

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى إدخال اسم المستخدم وكلمة المرور", values, fieldErrors(parsed.error));
  }
  const { username, password } = parsed.data;

  const ip = await clientIp();
  // The public demo account is shared, so only the per-IP limit applies to it
  const isDemo = username.toLowerCase() === DEMO_USERNAME;
  const allowed =
    (await rateLimit(`login:ip:${ip}`, 10, 15 * 60)) &&
    (isDemo || (await rateLimit(`login:user:${username.toLowerCase()}`, 10, 15 * 60)));
  if (!allowed) {
    return errorState("لقد تجاوزت الحد المسموح به لمحاولات الدخول، يرجى المحاولة بعد 15 دقيقة.", values);
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, username, password")
    .eq("username", username)
    .maybeSingle();

  // Compare even when the user doesn't exist, so timing doesn't reveal it
  const valid = await bcrypt.compare(password, user?.password ?? (await dummyHash()));
  if (!user || !valid || isClosedDemoAccount(user)) {
    return errorState("اسم المستخدم أو كلمة المرور غير صحيحة", values);
  }

  await createSession({ id: String(user.id), username: user.username });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// ---------------------------------------------------------- blog request

const categoryCodes = REQUEST_CATEGORIES.map(([code]) => code) as [string, ...string[]];

const blogRequestSchema = z.object({
  full_name: z.string().trim().min(3, "أدخل اسمك الكامل").max(100),
  email: z.email("أدخل بريداً إلكترونياً صحيحاً").trim().toLowerCase(),
  specialty: z.string().trim().min(2, "أدخل مجال تخصصك").max(100),
  experience_years: z.coerce
    .number({ message: "اختر عدد سنوات الخبرة" })
    .int()
    .min(1, "اختر عدد سنوات الخبرة")
    .max(60),
  sample_title: z.string().trim().min(5, "أدخل عنوان المقال").max(200),
  sample_category: z.enum(categoryCodes, { message: "اختر الفئة المناسبة" }),
  sample_content: z
    .string()
    .trim()
    .refine((text) => wordCount(text) >= 300, "يجب أن يحتوي المقال التجريبي على 300 كلمة على الأقل")
    .refine((text) => text.length <= 50_000, "المقال طويل جداً"),
  motivation: z.string().trim().min(20, "اكتب سطرين على الأقل عن دافعك للانضمام").max(2000),
});

export async function submitBlogRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);

  const parsed = blogRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", values, fieldErrors(parsed.error));
  }
  const data = parsed.data;

  if (!(await rateLimit(`blog-request:${await clientIp()}`, 3, 60 * 60))) {
    return errorState("لقد أرسلت عدة طلبات مؤخراً، يرجى المحاولة بعد ساعة.", values);
  }

  const { data: existing } = await supabase
    .from("blog_requests")
    .select("id")
    .eq("email", data.email)
    .eq("status", "pending")
    .limit(1);

  if (existing && existing.length > 0) {
    return errorState("يوجد طلب مقدم سابقاً بنفس البريد الإلكتروني في انتظار المراجعة", values);
  }

  const { data: created, error } = await supabase
    .from("blog_requests")
    .insert([{ ...data, status: "pending" }])
    .select("id")
    .single();

  if (error || !created) {
    console.error("Failed to save blog request:", error?.message);
    return errorState("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى", values);
  }

  updateTag("blog-requests");

  // Send the admin email after the response, so the applicant doesn't wait
  after(() =>
    notifyAdminNewRequest({
      id: String(created.id),
      fullName: data.full_name,
      email: data.email,
      specialty: data.specialty,
      experienceYears: data.experience_years,
      sampleTitle: data.sample_title,
      sampleCategory: data.sample_category,
      sampleContent: data.sample_content,
      motivation: data.motivation,
    }),
  );

  redirect(`/blog-request/sent?email=${encodeURIComponent(data.email)}`);
}

// ---------------------------------------------------------- registration

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "اسم المستخدم 3 أحرف على الأقل")
    .max(30, "اسم المستخدم 30 حرفاً على الأكثر")
    .regex(/^[a-zA-Z0-9_.-]+$/, "استخدم أحرفاً إنجليزية وأرقاماً و _ . - فقط"),
  email: z.email("أدخل بريداً إلكترونياً صحيحاً").trim().toLowerCase(),
  invite_code: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "أدخل كود التفعيل المرسل إلى بريدك"),
});

/** Readable temporary password without look-alike characters. */
function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 14 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", values, fieldErrors(parsed.error));
  }
  const { username, email, invite_code } = parsed.data;

  if (!(await rateLimit(`register:${await clientIp()}`, 5, 60 * 60))) {
    return errorState("لقد تجاوزت الحد المسموح به لمحاولات التسجيل، يرجى المحاولة بعد ساعة.", values);
  }

  const { data: invite } = await supabase
    .from("invite_codes")
    .select("id, full_name, email, specialty, is_used, expires_at")
    .eq("code", invite_code)
    .maybeSingle();

  // One message for "wrong code" and "code for another email", so the form
  // can't be used to check which codes exist
  if (!invite || invite.email.toLowerCase() !== email) {
    return errorState("كود التفعيل أو البريد الإلكتروني غير صحيح", values);
  }
  if (invite.is_used) {
    return errorState("هذا الكود تم استخدامه من قبل", values);
  }
  if (new Date(invite.expires_at) < new Date()) {
    return errorState("انتهت صلاحية كود التفعيل، يرجى التواصل مع إدارة المنصة", values);
  }

  const { data: taken } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username)
    .limit(1);
  if (taken && taken.length > 0) {
    return errorState("اسم المستخدم مستخدم بالفعل", values, {
      username: "اسم المستخدم مستخدم بالفعل، اختر اسماً آخر",
    });
  }

  // Claim the code first: only one request can flip is_used from false
  const { data: claimed } = await supabase
    .from("invite_codes")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("id", invite.id)
    .eq("is_used", false)
    .select("id");
  if (!claimed || claimed.length === 0) {
    return errorState("هذا الكود تم استخدامه من قبل", values);
  }

  const tempPassword = temporaryPassword();
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert([
      {
        username,
        password: await bcrypt.hash(tempPassword, 12),
        display_name_ar: invite.full_name,
        role: "user",
      },
    ])
    .select("id")
    .single();

  if (userError || !user) {
    console.error("Failed to create user:", userError?.message);
    // Release the code so the applicant can try again
    await supabase.from("invite_codes").update({ is_used: false, used_at: null }).eq("id", invite.id);
    return errorState("حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى", values);
  }

  await Promise.all([
    supabase.from("invite_codes").update({ used_by: user.id }).eq("id", invite.id),
    supabase.from("settings").insert([
      {
        user_id: user.id,
        email: invite.email,
        blog_title: `مدونة ${invite.full_name}`,
        blog_description: `مدونة متخصصة في ${invite.specialty}`,
        about_text: "",
        contact_info: "",
      },
    ]),
  ]);

  updateTag("users");
  after(() =>
    sendLoginCredentials(invite.email, {
      fullName: invite.full_name,
      username,
      tempPassword,
    }),
  );

  return {
    status: "success",
    message: `تم إنشاء حسابك بنجاح! أرسلنا بيانات الدخول إلى ${invite.email}.`,
  };
}

