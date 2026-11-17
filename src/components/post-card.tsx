import Link from "next/link";
import { Clock } from "lucide-react";
import type { PostSummary } from "@/lib/data";
import { categoryLabel, formatDate, isPostCategory, readingTimeLabel } from "@/lib/format";

export function PostCard({
  post,
  showAuthor = true,
}: {
  post: PostSummary;
  showAuthor?: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      {post.category && <CategoryBadge category={post.category} className="mb-3" />}
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
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link href={`/article/${post.id}`} className="text-sm font-medium text-brand hover:underline">
          اقرأ المزيد
        </Link>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Clock className="size-3.5" aria-hidden />
          {readingTimeLabel(post.readingMinutes)}
        </span>
      </div>
    </article>
  );
}

export function CategoryBadge({ category, className = "" }: { category: string; className?: string }) {
  const classes = `w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand ${className}`;
  return isPostCategory(category) ? (
    <Link href={`/category/${category}`} className={`${classes} hover:underline`}>
      {categoryLabel(category)}
    </Link>
  ) : (
    <span className={classes}>{categoryLabel(category)}</span>
  );
}

export function PostGrid({ posts, showAuthor = true }: { posts: PostSummary[]; showAuthor?: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showAuthor={showAuthor} />
      ))}
    </div>
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
