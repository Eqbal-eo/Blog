import Image from "next/image";

/** Round profile picture, or the first letter of the name when there is none. */
export function Avatar({
  src,
  name,
  size = 48,
  className = "",
}: {
  src: string | null | undefined;
  name: string;
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0) || "؟"}
    </span>
  );
}
