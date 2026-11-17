import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPendingPosts } from "@/lib/posts";
import { categoryLabel, formatDate } from "@/lib/format";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { badge, button, card } from "@/components/ui/styles";

export const metadata: Metadata = { title: "مراجعة التدوينات" };

const DONE: Record<string, string> = {
  approved: "تم نشر التدوينة وإشعار كاتبها.",
  rejected: "تم رفض التدوينة وإشعار كاتبها بالسبب.",
};

type Props = PageProps<"/admin/posts">;

export default function AdminPostsPage({ searchParams }: Props) {
  return (
    <>
      <PageHeader title="مراجعة التدوينات" description="التدوينات المرسلة من الكتّاب بانتظار الموافقة" />
      <Suspense fallback={<PageSkeleton />}>
        <PendingPosts searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PendingPosts({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdmin();
  const [posts, { done }] = await Promise.all([getPendingPosts(), searchParams]);
  const message = typeof done === "string" ? DONE[done] : undefined;

  return (
    <>
      {message && (
        <p role="status" className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-muted">
          لا توجد تدوينات بانتظار المراجعة.
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className={`${card} p-6`}>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="font-medium text-ink">{post.authorName}</span>
                <span>·</span>
                <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                {post.category && (
                  <span className={`${badge} bg-brand-soft text-brand`}>{categoryLabel(post.category)}</span>
                )}
              </div>
              <h2 className="mt-2 text-lg font-bold">{post.title}</h2>
              <p className="mt-2 leading-relaxed text-ink/75">{post.excerpt}</p>
              <Link href={`/admin/posts/${post.id}`} className={`${button.primary} mt-4`}>
                قراءة ومراجعة
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
