"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadImage, type UploadResult } from "@/lib/media";
import { DEMO_BLOCKED_MESSAGE, isDemoUser } from "@/lib/demo";

/** Uploads an image for use inside a post (from the editor). */
export async function uploadPostImage(formData: FormData): Promise<UploadResult> {
  const user = await requireUser();
  if (isDemoUser(user)) return { ok: false, message: DEMO_BLOCKED_MESSAGE };
  if (!(await rateLimit(`upload:${user.id}`, 60, 60 * 60))) {
    return { ok: false, message: "رفعت صوراً كثيرة خلال ساعة، حاول لاحقاً" };
  }
  return uploadImage(formData.get("file"), `posts/${user.id}`, { maxWidth: 1600 });
}
