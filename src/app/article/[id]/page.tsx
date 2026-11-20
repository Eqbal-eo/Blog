import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye, MessageSquare } from "lucide-react";
import { getPost } from "@/lib/data";
import { getApprovedComments } from "@/lib/comments";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatNumber, readingTimeLabel, viewsLabel } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { CategoryBadge } from "@/components/post-card";
import { FontSizeControl, ReadingProgress } from "@/components/reader-tools";
import { SubscribeForm } from "@/components/subscribe-form";
import { CommentForm, ViewBeacon } from "./article-client";

type Props = PageProps<"/article/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "التدوينة غير موجودة" };

  const description = post.summary ?? post.excerpt;
  return {
    title: post.title,
    description,
    authors: [{ name: post.authorName, url: `/author/${post.authorId}` }],
    alternates: { canonical: `/article/${post.id}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt ?? undefined,
      authors: [post.authorName],
    },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

export default function ArticlePage({ params }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ReadingProgress />
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
    <>
      <ViewBeacon postId={post.id} />
      <article>
        <header className="border-b border-line pb-8">
          {post.category && <CategoryBadge category={post.category} />}
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">{post.title}</h1>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link href={`/author/${post.authorId}`} className="group flex items-center gap-3">
              <Avatar src={post.authorAvatar} name={post.authorName} size={44} />
              <span>
                <span className="block font-medium group-hover:text-brand">{post.authorName}</span>
                <time dateTime={post.createdAt} className="text-sm text-muted">
                  {formatDate(post.createdAt)}
                </time>
              </span>
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden />
                {readingTimeLabel(post.readingMinutes)}
              </span>
              {post.viewCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" aria-hidden />
                  {viewsLabel(post.viewCount)}
                </span>
              )}
              <FontSizeControl />
            </div>
          </div>
        </header>

        {/* post.html is sanitized in getPost() */}
        <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>

      <aside className="mt-12 flex flex-wrap items-start gap-4 rounded-2xl border border-line bg-surface p-6">
        <Avatar src={post.authorAvatar} name={post.authorName} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">بقلم</p>
          <Link href={`/author/${post.authorId}`} className="text-lg font-bold hover:text-brand">
            {post.authorName}
          </Link>
          {post.authorBio && <p className="mt-2 leading-relaxed text-ink/75">{post.authorBio}</p>}
          <Link
            href={`/author/${post.authorId}`}
            className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
          >
            كل تدوينات {post.authorName}
          </Link>
        </div>
      </aside>

      <div className="mt-6">
        <SubscribeForm
          authorId={post.authorId}
          title={`تابع ${post.authorName}`}
          description="تصلك تدويناته الجديدة على بريدك فور نشرها."
        />
      </div>

      <Suspense fallback={null}>
        <Comments postId={post.id} />
      </Suspense>
    </>
  );
}

async function Comments({ postId }: { postId: string }) {
  const [comments, user] = await Promise.all([getApprovedComments(postId), getCurrentUser()]);

  return (
    <section className="mt-12" aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <MessageSquare className="size-5 text-brand" aria-hidden />
        التعليقات {comments.length > 0 && `(${formatNumber(comments.length)})`}
      </h2>

      {comments.length > 0 && (
        <ol className="mb-8 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span aria-hidden>
                <Avatar src={null} name={c.authorName} size={36} />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-5 py-4">
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-medium">{c.authorName}</span>
                  <time dateTime={c.createdAt} className="text-xs text-muted">
                    {formatDateTime(c.createdAt)}
                  </time>
                </p>
                <p className="mt-2 leading-relaxed whitespace-pre-line">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <CommentForm postId={postId} defaultName={user?.displayName} />
    </section>
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
