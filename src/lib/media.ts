import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { supabase } from "./supabase";

const BUCKET = "media";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UploadResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Validates an uploaded image, re-encodes it (resized, WebP, metadata such
 * as GPS location stripped) and stores it in the public "media" bucket.
 * Animated GIFs are stored as they are.
 */
export async function uploadImage(
  file: unknown,
  folder: string,
  { maxWidth, square = false }: { maxWidth: number; square?: boolean },
): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "لم يتم اختيار صورة" };
  }
  if (!ACCEPTED.has(file.type)) {
    return { ok: false, message: "صيغة غير مدعومة. استخدم JPG أو PNG أو WebP أو GIF" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "حجم الصورة أكبر من 5 ميغابايت" };
  }

  const input = Buffer.from(await file.arrayBuffer());
  let body: Buffer;
  let contentType: string;
  let ext: string;

  try {
    const image = sharp(input, { animated: file.type === "image/gif" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height) throw new Error("not an image");

    if (file.type === "image/gif" && (meta.pages ?? 1) > 1) {
      // Keep animation; just make sure it really is a GIF
      body = input;
      contentType = "image/gif";
      ext = "gif";
    } else {
      const pipeline = sharp(input).rotate(); // honor EXIF orientation, then drop EXIF
      body = await (square
        ? pipeline.resize(maxWidth, maxWidth, { fit: "cover" })
        : pipeline.resize({ width: maxWidth, withoutEnlargement: true })
      )
        .webp({ quality: 82 })
        .toBuffer();
      contentType = "image/webp";
      ext = "webp";
    }
  } catch {
    return { ok: false, message: "تعذّرت قراءة الصورة، جرّب ملفاً آخر" };
  }

  const path = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("Image upload failed:", error.message);
    return { ok: false, message: "تعذّر رفع الصورة، حاول مرة أخرى" };
  }

  return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Deletes a file previously returned by uploadImage (ignores other URLs). */
export async function deleteImage(url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  await supabase.storage.from(BUCKET).remove([url.slice(index + marker.length)]);
}
