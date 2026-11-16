"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadImage, type UploadResult } from "@/lib/media";

/** Uploads an image for use inside a post (from the editor). */
export async function uploadPostImage(formData: FormData): Promise<UploadResult> {
  const user = await requireUser();
  if (!(await rateLimit(`upload:${user.id}`, 60, 60 * 60))) {
    return { ok: false, message: "رفعت صوراً كثيرة خلال ساعة، حاول لاحقاً" };
  }
  return uploadImage(formData.get("file"), `posts/${user.id}`, { maxWidth: 1600 });
}
