"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";
import { getUserPost, parsePostId } from "@/lib/posts";
import { POST_CATEGORIES, wordCount } from "@/lib/format";
import { errorState, fieldErrors, formValues, type FormState } from "@/lib/forms";

const categoryCodes = POST_CATEGORIES.map(([code]) => code) as [string, ...string[]];

const postSchema = z.object({
  title: z.string().trim().min(3, "أدخل عنواناً للتدوينة").max(200, "العنوان طويل جداً"),
  category: z.enum(categoryCodes, { message: "اختر تصنيف التدوينة" }),
  content: z
    .string()
    .refine((html) => wordCount(html) >= 1, "اكتب محتوى التدوينة")
    .refine((html) => html.length <= 2_000_000, "التدوينة كبيرة جداً (قلّل الصور المضمّنة)"),
  intent: z.enum(["draft", "submit"]),
});

/** Invalidate every cached page that can show this post. */
function invalidatePost(postId: string, userId: string) {
  updateTag("posts");
  updateTag(`post-${postId}`);
  updateTag(`author-${userId}`);
}

export async function savePost(
  postId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("يرجى مراجعة الحقول المظللة", values, fieldErrors(parsed.error));
  }
  const { title, category, content, intent } = parsed.data;
  const html = sanitize(content);
  const isAdmin = user.role === "admin";

  if (postId === null) {
    // New post: authors save a draft or submit for review; admins publish directly
    const status = intent === "draft" ? "draft" : isAdmin ? "published" : "pending";
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title,
          category,
          content: html,
          status,
          user_id: Number(user.id),
          created_at: now,
          ...(status === "published" && { published_at: now }),
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create post:", error?.message);
      return errorState("حدث خطأ أثناء حفظ التدوينة، يرجى المحاولة مرة أخرى", values);
    }
    invalidatePost(String(data.id), user.id);
  } else {
    const existing = await getUserPost(user.id, postId);
    if (!existing) return errorState("لا يمكنك تعديل تدوينة لا تملكها", values);

    // Edits to an approved post stay published; anything else needs review
    let status: string;
    if (intent === "draft") status = "draft";
    else if (isAdmin || existing.status === "published") status = "published";
    else status = "pending";

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("posts")
      .update({
        title,
        category,
        content: html,
        status,
        updated_at: now,
        rejection_reason: null,
        ...(status === "published" && existing.status !== "published" && { published_at: now }),
      })
      .eq("id", Number(postId))
      .eq("user_id", Number(user.id));

    if (error) {
      console.error("Failed to update post:", error.message);
      return errorState("حدث خطأ أثناء حفظ التدوينة، يرجى المحاولة مرة أخرى", values);
    }
    invalidatePost(postId, user.id);
  }

  const message =
    intent === "draft"
      ? "saved-draft"
      : isAdmin
        ? "published"
        : "submitted";
  redirect(`/dashboard/posts?done=${message}`);
}

const idsSchema = z.array(z.string().regex(/^\d{1,12}$/)).min(1).max(200);

/** Deletes one or more of the current user's posts. */
export async function deletePosts(ids: string[]): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "لم يتم تحديد تدوينات للحذف" };

  // Keep only ids the user actually owns
  const { data: owned } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", Number(user.id))
    .in("id", parsed.data.map((id) => parsePostId(id)!));
  const ownedIds = (owned ?? []).map((row) => row.id as number);
  if (ownedIds.length === 0) return { ok: false, message: "لم يتم العثور على التدوينات المحددة" };

  // Notifications reference posts, so remove them first
  await supabase.from("notifications").delete().in("post_id", ownedIds);

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("user_id", Number(user.id))
    .in("id", ownedIds)
    .select("id");

  if (error) {
    console.error("Failed to delete posts:", error.message);
    return { ok: false, message: "فشل حذف التدوينات، يرجى المحاولة مرة أخرى" };
  }

  for (const row of data ?? []) invalidatePost(String(row.id), user.id);

  const count = data?.length ?? 0;
  return { ok: true, message: count === 1 ? "تم حذف التدوينة" : `تم حذف ${count} تدوينات` };
}
