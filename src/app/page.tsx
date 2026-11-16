import { Suspense } from "react";
import Link from "next/link";
import { PostCard, PostGridSkeleton } from "@/components/post-card";
import { getLatestPosts } from "@/lib/data";

const STEPS = [
  {
    title: "قدّم طلب المدونة",
    text: "املأ نموذج طلب إنشاء المدونة مع نموذج مقال تجريبي يعكس أسلوبك في الكتابة",
  },
  {
    title: "مراجعة الطلب",
    text: "فريق المراجعة سيقوم بدراسة طلبك والموافقة عليه وإرسال كود التفعيل إلى بريدك",
  },
  {
    title: "ابدأ التدوين",
    text: "أكمل إنشاء حسابك باستخدام كود التفعيل واستمتع بالكتابة ونشر المقالات",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <h1 className="text-5xl font-bold sm:text-6xl">
          مدونات <span className="text-brand">آفاق</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          منصة للتدوين الفكري والثقافي والسياسي تجمع أصواتًا متعددة في مكان واحد
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/blog-request"
            className="rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand/90"
          >
            ابدأ مدونتك الآن
          </Link>
          <Link
            href="/blogs"
            className="rounded-lg border border-ink/80 px-6 py-3 font-medium transition hover:bg-ink hover:text-white"
          >
            تصفح المدونات
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold">التدوينات الأخيرة</h2>
        <Suspense fallback={<PostGridSkeleton count={6} />}>
          <LatestPosts />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold">كيف تعمل المنصة؟</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-surface p-6 text-center"
            >
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">انضم إلى مجتمع الكتّاب والمفكرين</h2>
        <p className="mt-3 leading-relaxed text-muted">
          شارك أفكارك وآرائك مع العالم وانضم إلى نقاشات فكرية وثقافية عميقة
        </p>
        <Link
          href="/blog-request"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand/90"
        >
          سجّل الآن
        </Link>
      </section>
    </>
  );
}

async function LatestPosts() {
  const posts = await getLatestPosts(6);

  if (posts.length === 0) {
    return <p className="text-center text-muted">لا توجد تدوينات منشورة بعد.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
