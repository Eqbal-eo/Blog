"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { deleteSession } from "@/lib/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { errorState, fieldErrors, formValues, type FormState } from "@/lib/forms";
import { deleteImage, uploadImage } from "@/lib/media";
import { DEMO_BLOCKED_MESSAGE, isDemoUser } from "@/lib/demo";

const optionalText = (max: number) =>
  z.string().trim().max(max, `النص أطول من ${max} حرف`).optional().default("");

const profileSchema = z.object({
  display_name_ar: z.string().trim().min(2, "أدخل الاسم المعروض").max(80),
  bio: optionalText(500),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (isDemoUser(user)) return errorState(DEMO_BLOCKED_MESSAGE);
  const values = formValues(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", values, fieldErrors(parsed.error));
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name_ar: parsed.data.display_name_ar, bio: parsed.data.bio || null })
    .eq("id", Number(user.id));

  if (error) return errorState("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", values);

  // Name and bio appear on every post card and the writers list
  updateTag("users");
  updateTag("posts");
  updateTag(`author-${user.id}`);
  return { status: "success", message: "تم حفظ الملف الشخصي", values };
}

/** Uploads a new profile picture, or removes it when `remove` is set. */
export async function updateProfileImage(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (isDemoUser(user)) return errorState(DEMO_BLOCKED_MESSAGE);
  const id = Number(user.id);

  const { data: settings } = await supabase
    .from("settings")
    .select("id, profile_image")
    .eq("user_id", id)
    .maybeSingle();

  let imageUrl: string | null = null;
  if (formData.get("remove") !== "1") {
    if (!(await rateLimit(`avatar:${user.id}`, 10, 60 * 60))) {
      return errorState("محاولات كثيرة، حاول بعد ساعة");
    }
    const upload = await uploadImage(formData.get("image"), `avatars/${user.id}`, { maxWidth: 400, square: true });
    if (!upload.ok) return errorState(upload.message);
    imageUrl = upload.url;
  }

  const { error } = settings
    ? await supabase.from("settings").update({ profile_image: imageUrl }).eq("id", settings.id)
    : await supabase.from("settings").insert([{ user_id: id, profile_image: imageUrl }]);

  if (error) {
    await deleteImage(imageUrl);
    return errorState("حدث خطأ أثناء حفظ الصورة");
  }

  // The old file is no longer referenced anywhere
  await deleteImage(settings?.profile_image);

  updateTag("users");
  updateTag("posts");
  updateTag(`author-${user.id}`);
  return { status: "success", message: imageUrl ? "تم تحديث الصورة" : "تمت إزالة الصورة" };
}

const blogSchema = z.object({
  blog_title: optionalText(120),
  blog_description: optionalText(300),
  about_text: optionalText(3000),
  contact_info: optionalText(1000),
  email: z
    .union([z.literal(""), z.email("أدخل بريداً إلكترونياً صحيحاً")])
    .optional()
    .default(""),
});

export async function updateBlogSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (isDemoUser(user)) return errorState(DEMO_BLOCKED_MESSAGE);
  const values = formValues(formData);
  const parsed = blogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", values, fieldErrors(parsed.error));
  }

  // These fields are plain text; the author page renders line breaks
  const data = { ...parsed.data, user_id: Number(user.id) };

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("user_id", Number(user.id))
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("settings").update(data).eq("id", existing.id)
    : await supabase.from("settings").insert([data]);

  if (error) return errorState("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", values);

  updateTag(`author-${user.id}`);
  updateTag("site-settings");
  return { status: "success", message: "تم حفظ إعدادات المدونة", values };
}

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "أدخل كلمة المرور الحالية"),
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

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (isDemoUser(user)) return errorState(DEMO_BLOCKED_MESSAGE);
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", undefined, fieldErrors(parsed.error));
  }

  if (!(await rateLimit(`password:${user.id}:${await clientIp()}`, 5, 15 * 60))) {
    return errorState("محاولات كثيرة، يرجى المحاولة بعد 15 دقيقة.");
  }

  const { data } = await supabase.from("users").select("password").eq("id", Number(user.id)).single();
  if (!data || !(await bcrypt.compare(parsed.data.current_password, data.password))) {
    return errorState("كلمة المرور الحالية غير صحيحة", undefined, {
      current_password: "كلمة المرور الحالية غير صحيحة",
    });
  }

  const { error } = await supabase
    .from("users")
    .update({ password: await bcrypt.hash(parsed.data.new_password, 12) })
    .eq("id", Number(user.id));

  if (error) return errorState("حدث خطأ أثناء تغيير كلمة المرور");
  return { status: "success", message: "تم تغيير كلمة المرور" };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (isDemoUser(user)) return errorState(DEMO_BLOCKED_MESSAGE);
  const password = String(formData.get("password") ?? "");

  if (!(await rateLimit(`delete-account:${user.id}`, 5, 15 * 60))) {
    return errorState("محاولات كثيرة، يرجى المحاولة بعد 15 دقيقة.");
  }

  const { data } = await supabase.from("users").select("password").eq("id", Number(user.id)).single();
  if (!data || !password || !(await bcrypt.compare(password, data.password))) {
    return errorState("كلمة المرور غير صحيحة");
  }

  const id = Number(user.id);
  const { data: profile } = await supabase.from("settings").select("profile_image").eq("user_id", id).maybeSingle();
  // Order matters: rows that reference the user or their posts go first
  const steps = [
    () => supabase.from("notifications").delete().eq("user_id", id),
    () => supabase.from("invite_codes").update({ used_by: null }).eq("used_by", id),
    () => supabase.from("blog_requests").update({ reviewed_by: null }).eq("reviewed_by", id),
    () => supabase.from("settings").delete().eq("user_id", id),
    () => supabase.from("posts").delete().eq("user_id", id),
    () => supabase.from("users").delete().eq("id", id),
  ];
  for (const step of steps) {
    const { error } = await step();
    if (error) {
      console.error("Account deletion failed:", error.message);
      return errorState("حدث خطأ أثناء حذف الحساب، يرجى المحاولة مرة أخرى");
    }
  }

  await deleteImage(profile?.profile_image);
  await supabase.from("subscribers").delete().eq("author_id", id);
  updateTag("posts");
  updateTag("users");
  updateTag(`author-${user.id}`);
  await deleteSession();
  redirect("/?account=deleted");
}
