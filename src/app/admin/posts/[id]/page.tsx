import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getPostForReview } from "@/lib/posts";
import { sanitize } from "@/lib/sanitize";
import { categoryLabel, formatDate, POST_STATUS_LABELS } from "@/lib/format";
import { PageSkeleton } from "@/components/dashboard-shell";
import { badge, card, statusBadge } from "@/components/ui/styles";
import { approvePost, rejectPost } from "../../actions";
import { ReviewControls } from "../../review-controls";

export const metadata: Metadata = { title: "مراجعة تدوينة" };

type Props = PageProps<"/admin/posts/[id]">;

export default function ReviewPostPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReviewPost params={params} />
    </Suspense>
  );
}

async function ReviewPost({ params }: Pick<Props, "params">) {
  const [, { id }] = await Promise.all([requireAdmin(), params]);
  const post = await getPostForReview(id);
  if (!post) notFound();

  return (
    <>
      <Link href="/admin/posts" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowRight className="size-4" aria-hidden />
        كل التدوينات المعلقة
      </Link>

      {post.status === "pending" ? (
        <ReviewControls
          approve={approvePost.bind(null, post.id)}
          reject={rejectPost.bind(null, post.id)}
          approveLabel="الموافقة والنشر"
          rejectLabel="رفض التدوينة"
          rejectHint="سيصل هذا السبب إلى الكاتب، ليعدّل التدوينة ويعيد إرسالها"
        />
      ) : (
        <p className="rounded-lg bg-stone-100 px-4 py-3 text-sm">
          هذه التدوينة ليست بانتظار المراجعة (حالتها: {POST_STATUS_LABELS[post.status]}).
        </p>
      )}

      <article className={`${card} mt-6 p-6 sm:p-10`}>
        <header className="border-b border-line pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${badge} ${statusBadge[post.status]}`}>{POST_STATUS_LABELS[post.status]}</span>
            {post.category && (
              <span className={`${badge} bg-brand-soft text-brand`}>{categoryLabel(post.category)}</span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-snug">{post.title}</h1>
          <p className="mt-3 text-muted">
            {post.authorName} · <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </p>
        </header>
        <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: sanitize(post.content) }} />
      </article>
    </>
  );
}
