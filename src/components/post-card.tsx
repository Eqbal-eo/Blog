import Link from "next/link";
import type { PostSummary } from "@/lib/data";
import { categoryLabel, formatDate } from "@/lib/format";

export function PostCard({
  post,
  showAuthor = true,
}: {
  post: PostSummary;
  showAuthor?: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      {post.category && (
        <span className="mb-3 w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
          {categoryLabel(post.category)}
        </span>
      )}
      <h3 className="text-lg font-bold leading-relaxed">
        <Link href={`/article/${post.id}`} className="hover:text-brand">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-muted">
        {showAuthor && (
          <>
            <Link href={`/author/${post.authorId}`} className="hover:text-brand">
              {post.authorName}
            </Link>
            {" · "}
          </>
        )}
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
      </p>
      <p className="mt-3 flex-1 leading-relaxed text-ink/75">{post.excerpt}</p>
      <Link
        href={`/article/${post.id}`}
        className="mt-4 w-fit text-sm font-medium text-brand hover:underline"
      >
        اقرأ المزيد
      </Link>
    </article>
  );
}

export function PostGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-2xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}
