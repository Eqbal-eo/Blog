"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { parsePostId } from "@/lib/posts";
import { createNotification } from "@/lib/notifications";
import { generateInviteCode } from "@/lib/invite-code";
import { sendInviteCode, sendRequestRejected } from "@/lib/email";
import { errorState, type FormState } from "@/lib/forms";

const reasonSchema = z.string().trim().min(5, "اكتب سبباً واضحاً (5 أحرف على الأقل)").max(2000);

// ------------------------------------------------------------------ posts

export async function approvePost(postId: string): Promise<FormState> {
  await requireAdmin();
  const id = parsePostId(postId);
  if (id === null) return errorState("التدوينة غير موجودة");

  const { data: post } = await supabase
    .from("posts")
    .update({ status: "published", published_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, user_id, title")
    .maybeSingle();

  if (!post) return errorState("التدوينة غير موجودة أو تمت مراجعتها من قبل");

  await createNotification(
    String(post.user_id),
    String(post.id),
    `تمت الموافقة على تدوينتك "${post.title}" ونشرها`,
    "post_approved",
  );

  updateTag("posts");
  updateTag(`post-${post.id}`);
  updateTag(`author-${post.user_id}`);
  redirect("/admin/posts?done=approved");
}

export async function rejectPost(postId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parsePostId(postId);
  if (id === null) return errorState("التدوينة غير موجودة");

  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!reason.success) {
    return errorState(reason.error.issues[0].message, { reason: String(formData.get("reason") ?? "") });
  }

  const { data: post } = await supabase
    .from("posts")
    .update({ status: "rejected", rejection_reason: reason.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, user_id, title")
    .maybeSingle();

  if (!post) return errorState("التدوينة غير موجودة أو تمت مراجعتها من قبل");

  await createNotification(
    String(post.user_id),
    String(post.id),
    `لم تتم الموافقة على تدوينتك "${post.title}": ${reason.data}`,
    "post_rejected",
  );

  redirect("/admin/posts?done=rejected");
}

// --------------------------------------------------------- blog requests

function parseRequestId(id: string): number | null {
  return /^\d{1,12}$/.test(id) ? Number(id) : null;
}

export async function approveRequest(requestId: string): Promise<FormState> {
  const admin = await requireAdmin();
  const id = parseRequestId(requestId);
  if (id === null) return errorState("الطلب غير موجود");

  // Only a pending request can be approved, and only once
  const { data: request } = await supabase
    .from("blog_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: Number(admin.id),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, full_name, email, specialty")
    .maybeSingle();

  if (!request) return errorState("الطلب غير موجود أو تمت مراجعته من قبل");

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const { error } = await supabase.from("invite_codes").insert([
    {
      code,
      blog_request_id: request.id,
      full_name: request.full_name,
      email: request.email,
      specialty: request.specialty,
      expires_at: expiresAt.toISOString(),
    },
  ]);

  if (error) {
    console.error("Failed to create invite code:", error.message);
    // Put the request back so the admin can retry
    await supabase
      .from("blog_requests")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", request.id);
    return errorState("تعذّر إنشاء كود التفعيل، يرجى المحاولة مرة أخرى");
  }

  after(() =>
    sendInviteCode(request.email, {
      fullName: request.full_name,
      specialty: request.specialty,
      inviteCode: code,
    }),
  );

  updateTag("blog-requests");
  redirect(`/admin/requests/${request.id}?done=approved`);
}

export async function rejectRequest(
  requestId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const id = parseRequestId(requestId);
  if (id === null) return errorState("الطلب غير موجود");

  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!reason.success) {
    return errorState(reason.error.issues[0].message, { reason: String(formData.get("reason") ?? "") });
  }

  const { data: request } = await supabase
    .from("blog_requests")
    .update({
      status: "rejected",
      rejection_reason: reason.data,
      reviewed_at: new Date().toISOString(),
      reviewed_by: Number(admin.id),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, full_name, email")
    .maybeSingle();

  if (!request) return errorState("الطلب غير موجود أو تمت مراجعته من قبل");

  after(() => sendRequestRejected(request.email, { fullName: request.full_name, reason: reason.data }));

  updateTag("blog-requests");
  redirect(`/admin/requests/${request.id}?done=rejected`);
}

/** Issues a fresh code for an approved applicant whose code expired. */
export async function resendInviteCode(requestId: string): Promise<FormState> {
  await requireAdmin();
  const id = parseRequestId(requestId);
  if (id === null) return errorState("الطلب غير موجود");

  const { data: request } = await supabase
    .from("blog_requests")
    .select("id, full_name, email, specialty, status")
    .eq("id", id)
    .maybeSingle();
  if (!request || request.status !== "approved") return errorState("الطلب غير موجود أو غير مقبول");

  const { data: used } = await supabase
    .from("invite_codes")
    .select("id")
    .eq("blog_request_id", id)
    .eq("is_used", true)
    .limit(1);
  if (used && used.length > 0) return errorState("أنشأ صاحب الطلب حسابه بالفعل");

  const code = generateInviteCode();
  const { error } = await supabase.from("invite_codes").insert([
    {
      code,
      blog_request_id: request.id,
      full_name: request.full_name,
      email: request.email,
      specialty: request.specialty,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  if (error) return errorState("تعذّر إنشاء كود جديد");

  after(() =>
    sendInviteCode(request.email, {
      fullName: request.full_name,
      specialty: request.specialty,
      inviteCode: code,
    }),
  );
  return { status: "success", message: `أُرسل كود جديد إلى ${request.email}` };
}
