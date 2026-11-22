// Shared by the browser and the server, so no server-only imports here.

/** Vercel rejects request bodies over 4.5 MB; leave room for the form overhead. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type PreparedImage = { ok: true; file: File } | { ok: false; message: string };

/**
 * Browser only: shrinks an image that is too large to send. Smaller files are
 * left untouched, the server re-encodes them anyway.
 */
export async function prepareImage(file: File, maxWidth: number): Promise<PreparedImage> {
  if (file.size <= MAX_UPLOAD_BYTES) return { ok: true, file };
  // A canvas would keep only the first frame of an animation
  if (file.type === "image/gif") {
    return { ok: false, message: "حجم صورة GIF أكبر من 4 ميغابايت" };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    // Browsers that can't encode WebP return a PNG, hence the type from the blob
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.size > MAX_UPLOAD_BYTES) {
      return { ok: false, message: "الصورة كبيرة جداً، اختر صورة أصغر من 4 ميغابايت" };
    }
    return { ok: true, file: new File([blob], `image.${blob.type.split("/")[1]}`, { type: blob.type }) };
  } catch {
    return { ok: false, message: "تعذّرت قراءة الصورة، جرّب ملفاً آخر" };
  }
}
