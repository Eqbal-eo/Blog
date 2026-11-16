import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { button, card } from "@/components/ui/styles";

export const metadata: Metadata = { title: "الإشعارات" };

const PAGE_SIZE = 15;

type Props = PageProps<"/dashboard/notifications">;

export default function NotificationsPage({ searchParams }: Props) {
  return (
    <>
      <PageHeader title="الإشعارات" />
      <Suspense fallback={<PageSkeleton />}>
        <Notifications searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Notifications({ searchParams }: Pick<Props, "searchParams">) {
  const user = await requireUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { items, total } = await getNotifications(user.id, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  // Unread items are highlighted on this visit, then marked as read
  const unreadIds = items.filter((n) => !n.isRead).map((n) => Number(n.id));
  if (unreadIds.length > 0) {
    after(async () => {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", Number(user.id))
        .in("id", unreadIds);
    });
  }

  if (items.length === 0) {
    return <p className="text-muted">لا توجد إشعارات بعد.</p>;
  }

  const hasMore = page * PAGE_SIZE < total;

  return (
    <>
      <ul className={`${card} divide-y divide-line`}>
        {items.map((n) => {
          const approved = n.type === "post_approved";
          const Icon = approved ? CheckCircle2 : XCircle;
          return (
            <li key={n.id} className={`flex gap-4 p-5 ${n.isRead ? "" : "bg-brand-soft/40"}`}>
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${approved ? "text-emerald-600" : "text-red-600"}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className={`leading-relaxed ${n.isRead ? "" : "font-medium"}`}>
                  {!n.isRead && <span className="sr-only">جديد: </span>}
                  {n.message}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted">
                  <time dateTime={n.createdAt}>{formatDateTime(n.createdAt)}</time>
                  {n.postId && (
                    <Link
                      href={approved ? `/article/${n.postId}` : `/dashboard/posts/${n.postId}/edit`}
                      className="text-brand hover:underline"
                    >
                      {approved ? "عرض التدوينة" : "تعديل التدوينة"}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {(page > 1 || hasMore) && (
        <nav className="mt-6 flex justify-between" aria-label="صفحات الإشعارات">
          {page > 1 ? (
            <Link href={`/dashboard/notifications?page=${page - 1}`} className={button.outline}>
              الأحدث
            </Link>
          ) : <span />}
          {hasMore && (
            <Link href={`/dashboard/notifications?page=${page + 1}`} className={button.outline}>
              الأقدم
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
