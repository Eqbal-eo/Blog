import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/data";
import { categoryLabel, formatDate } from "@/lib/format";

type Props = PageProps<"/article/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "التدوينة غير موجودة" };

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.authorName }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.createdAt,
      authors: [post.authorName],
    },
  };
}

export default function ArticlePage({ params }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Suspense fallback={<ArticleSkeleton />}>
        <Article params={params} />
      </Suspense>
    </div>
  );
}

async function Article({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <article>
      <header className="border-b border-line pb-8">
        {post.category && (
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            {categoryLabel(post.category)}
          </span>
        )}
        <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-muted">
          <Link
            href={`/author/${post.authorId}`}
            className="font-medium text-ink hover:text-brand"
          >
            {post.authorName}
          </Link>
          {" · "}
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </p>
      </header>

      {/* post.html is sanitized in getPost() */}
      <div
        className="article-body mt-8"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <footer className="mt-12 border-t border-line pt-6">
        <Link
          href={`/author/${post.authorId}`}
          className="font-medium text-brand hover:underline"
        >
          المزيد من تدوينات {post.authorName}
        </Link>
      </footer>
    </article>
  );
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-3/4 rounded bg-line" />
      <div className="h-4 w-1/3 rounded bg-line" />
      <div className="mt-10 h-72 rounded-2xl bg-line/60" />
    </div>
  );
}
