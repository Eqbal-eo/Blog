import { Suspense } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { PostGrid, PostGridSkeleton } from "@/components/post-card";
import { SubscribeForm } from "@/components/subscribe-form";
import { HeroHorizon } from "@/components/hero-horizon";
import { JoinBanner } from "@/components/join-banner";
import { getLatestPosts, getMostReadPosts } from "@/lib/data";
import { categoryLabel, formatNumber, POST_CATEGORIES } from "@/lib/format";

const HERO_WORDS = POST_CATEGORIES.map(([, label]) => label);

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
      <section className="relative isolate overflow-hidden">
        <HeroHorizon words={HERO_WORDS} />
        <div className="mx-auto max-w-3xl px-4 pt-16 pb-48 text-center sm:pt-24 sm:pb-60">
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
              className="rounded-lg border border-ink/80 bg-paper px-6 py-3 font-medium transition hover:bg-ink hover:text-paper"
            >
              تصفح المدونات
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold">التدوينات الأخيرة</h2>
        <Suspense fallback={<PostGridSkeleton count={6} />}>
          <LatestPosts />
        </Suspense>
        <div className="mt-8 text-center">
          <Link
            href="/articles"
            className="inline-block rounded-lg border border-ink/80 px-6 py-3 font-medium transition hover:bg-ink hover:text-paper"
          >
            كل التدوينات
          </Link>
        </div>
      </section>

      <Suspense fallback={null}>
        <MostRead />
      </Suspense>

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

      <section className="mx-auto max-w-xl px-4 py-8">
        <SubscribeForm
          title="النشرة البريدية"
          description="تصلك كل تدوينة جديدة في مدونات آفاق على بريدك."
        />
      </section>

      <JoinBanner />
    </>
  );
}

async function LatestPosts() {
  const posts = await getLatestPosts(6);

  if (posts.length === 0) {
    return <p className="text-center text-muted">لا توجد تدوينات منشورة بعد.</p>;
  }
  return <PostGrid posts={posts} />;
}

async function MostRead() {
  const posts = await getMostReadPosts(5);
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="mb-6 text-center text-2xl font-bold">الأكثر قراءة</h2>
      <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {posts.map((post, index) => (
          <li key={post.id} className="flex items-center gap-4 px-5 py-4">
            <span className="w-6 text-center text-2xl font-bold text-brand/60" aria-hidden>
              {formatNumber(index + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/article/${post.id}`} className="block truncate font-medium hover:text-brand">
                {post.title}
              </Link>
              <p className="text-sm text-muted">
                {post.authorName}
                {post.category && ` · ${categoryLabel(post.category)}`}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted">
              <Eye className="size-4" aria-hidden />
              {formatNumber(post.viewCount)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
