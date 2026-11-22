import Link from "next/link";

/** The closing call to action on the home page. Its colours are fixed, so white text reads in both themes. */
export function JoinBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16">
      <div className="relative isolate overflow-hidden rounded-3xl bg-linear-to-b from-[#743c1b] via-[#6b3314] to-[#4d220b] px-6 py-12 text-center text-white shadow-xl shadow-[#4d220b]/15 sm:py-14 dark:from-[#5e3018] dark:via-[#4f2611] dark:to-[#371807] dark:shadow-none">
        {/* Soft light rising from the lower edge */}
        <div
          aria-hidden
          className="absolute inset-x-[10%] -bottom-24 -z-10 h-52 rounded-[50%] bg-[#d59a70]/20 blur-3xl"
        />
        <p className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-[#f6dfce] ring-1 ring-white/10">
          مساحة مخصصة لأصحاب الأثر
        </p>
        <h2 className="mt-5 text-3xl leading-snug font-bold sm:text-4xl">انضم إلى مجتمع الكتّاب والمفكرين</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-loose text-[#f1d9c7]">
          شارك أفكارك وآراءك مع العالم وانضم إلى نقاشات فكرية وثقافية عميقة تُثري الوعي العربي.
        </p>
        <Link
          href="/blog-request"
          className="mt-8 inline-block rounded-xl bg-white px-10 py-3.5 font-bold text-[#6b3314] transition hover:bg-[#f9eee5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-safe:hover:-translate-y-0.5"
        >
          سجّل الآن
        </Link>
      </div>
    </section>
  );
}
