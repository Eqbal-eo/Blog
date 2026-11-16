import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPendingComments } from "@/lib/comments";
import { formatDateTime } from "@/lib/format";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { card } from "@/components/ui/styles";
import { CommentActions } from "./comment-actions";

export const metadata: Metadata = { title: "مراجعة التعليقات" };

export default function AdminCommentsPage() {
  return (
    <>
      <PageHeader title="مراجعة التعليقات" description="تعليقات القرّاء بانتظار الموافقة قبل ظهورها" />
      <Suspense fallback={<PageSkeleton />}>
        <PendingComments />
      </Suspense>
    </>
  );
}

async function PendingComments() {
  await requireAdmin();
  const comments = await getPendingComments();

  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-12 text-center text-muted">
        لا توجد تعليقات بانتظار المراجعة.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className={`${card} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p>
              <span className="font-bold">{c.authorName}</span>
              {c.authorEmail && (
                <span className="ms-2 text-muted" dir="ltr">
                  {c.authorEmail}
                </span>
              )}
            </p>
            <time dateTime={c.createdAt} className="text-muted">
              {formatDateTime(c.createdAt)}
            </time>
          </div>
          <p className="mt-1 text-sm text-muted">
            على:{" "}
            <Link href={`/article/${c.postId}`} className="text-brand hover:underline" target="_blank">
              {c.postTitle}
            </Link>
          </p>
          <p className="mt-3 leading-relaxed whitespace-pre-line">{c.body}</p>
          <CommentActions id={c.id} />
        </li>
      ))}
    </ul>
  );
}
