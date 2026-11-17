import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard, PostGridSkeleton } from "@/components/post-card";
import { Avatar } from "@/components/avatar";
import { SubscribeForm } from "@/components/subscribe-form";
import { getAuthor } from "@/lib/data";
import { postsCount } from "@/lib/format";

type Props = PageProps<"/author/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) return { title: "الكاتب غير موجود" };

  return {
    title: author.blogTitle || `مدونة ${author.name}`,
    description: author.blogDescription || author.bio || undefined,
  };
}

export default function AuthorPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Suspense fallback={<PostGridSkeleton count={6} />}>
        <AuthorProfile params={params} />
      </Suspense>
    </div>
  );
}

async function AuthorProfile({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) notFound();

  const hasSidebar = Boolean(
    author.aboutHtml || author.contactHtml || author.email,
  );

  return (
    <>
      <header className="flex flex-wrap items-start gap-6 rounded-2xl border border-line bg-surface p-8">
        <Avatar src={author.avatar} name={author.name} size={96} />
        <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand">
          {postsCount(author.posts.length)}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {author.blogTitle || author.name}
        </h1>
        {author.blogTitle && (
          <p className="mt-1 text-muted">بقلم {author.name}</p>
        )}
        <p className="mt-4 max-w-3xl leading-relaxed text-ink/75">
          {author.blogDescription || author.bio || "لم يتم إضافة نبذة بعد"}
        </p>
        </div>
      </header>

      <div className="mt-6">
        <SubscribeForm
          authorId={author.id}
          title={`تابع ${author.name}`}
          description="تصلك تدويناته الجديدة على بريدك فور نشرها."
        />
      </div>

      <div
        className={
          hasSidebar ? "mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]" : "mt-8"
        }
      >
        <section>
          <h2 className="mb-6 text-xl font-bold">التدوينات</h2>
          {author.posts.length === 0 ? (
            <p className="text-muted">لم ينشر هذا الكاتب أي تدوينة بعد.</p>
          ) : (
            <div
              className={
                hasSidebar
                  ? "grid gap-6 sm:grid-cols-2"
                  : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {author.posts.map((post) => (
                <PostCard key={post.id} post={post} showAuthor={false} />
              ))}
            </div>
          )}
        </section>

        {hasSidebar && (
          <aside className="space-y-6">
            {author.aboutHtml && (
              <InfoCard title="عن الكاتب" html={author.aboutHtml} />
            )}
            {(author.contactHtml || author.email) && (
              <InfoCard title="التواصل" html={author.contactHtml}>
                {author.email && (
                  <a
                    href={`mailto:${author.email}`}
                    dir="ltr"
                    className="mt-2 block text-end text-brand hover:underline"
                  >
                    {author.email}
                  </a>
                )}
              </InfoCard>
            )}
          </aside>
        )}
      </div>

      <Link
        href="/blogs"
        className="mt-10 inline-block font-medium text-brand hover:underline"
      >
        كل المدونات
      </Link>
    </>
  );
}

function InfoCard({
  title,
  html,
  children,
}: {
  title: string;
  /** Sanitized in getAuthor(). */
  html: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-bold">{title}</h2>
      {html && (
        <div
          className="mt-3 whitespace-pre-line leading-relaxed text-ink/75"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {children}
    </div>
  );
}
