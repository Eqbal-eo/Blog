import Image from "next/image";
import artwork from "@/assets/images/login-illustration.webp";

/**
 * Decorative: a pen writing in an open book while the sun rises on the horizon (آفاق).
 * The artwork is transparent, so one file serves both themes. It stays lazy, so
 * phones, where it is hidden, don't download it.
 */
export function LoginIllustration() {
  return (
    <div aria-hidden className="text-center">
      <Image
        src={artwork}
        alt=""
        sizes="(min-width: 1152px) 512px, 50vw"
        className="mx-auto h-auto w-full max-w-lg dark:brightness-90"
      />
      <p className="mt-6 text-3xl font-bold">
        لكل فكرة <span className="text-brand">أفق</span>
      </p>
      <p className="mt-3 text-muted">اكتب، وشارك صوتك مع قرّاء يبحثون عن المعنى</p>
    </div>
  );
}
