import Image from "next/image";
import { UserRound } from "lucide-react";

/** Round profile picture, or a neutral person icon when there is none. */
export function Avatar({
  src,
  size = 48,
  className = "",
}: {
  src: string | null | undefined;
  /** Kept for callers; the fallback is an icon (Arabic initials like «إ» read poorly). */
  name?: string;
  size?: number;
  className?: string;
}) {
  // Only uploaded images (absolute https URLs); old relative "/uploads/…"
  // paths from the Express app point at files that no longer exist
  if (src?.startsWith("https://")) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ring-1 ring-line ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand ${className}`}
      style={{ width: size, height: size }}
    >
      <UserRound style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
}
