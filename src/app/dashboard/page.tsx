import { Suspense } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserPosts } from "@/lib/posts";
import { getNotifications } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatNumber, POST_STATUS_LABELS } from "@/lib/format";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { badge, button, card, statusBadge } from "@/components/ui/styles";

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  const [posts, notifications, admin] = await Promise.all([
    getUserPosts(user.id),
    getNotifications(user.id, { limit: 3 }),
    isAdmin ? adminCounts() : null,
  ]);

  const count = (status: string) => posts.filter((p) => p.status === status).length;
  const stats = [
    { label: "إجمالي التدوينات", value: posts.length },
    { label: "المنشورة", value: count("published") },
    { label: "قيد المراجعة", value: count("pending") },
    { label: "المسودات", value: count("draft") },
    ...(count("rejected") > 0 ? [{ label: "المرفوضة", value: count("rejected") }] : []),
  ];

  return (
    <>
      <PageHeader
        title={`أهلاً، ${user.displayName}`}
        description="هذه نظرة سريعة على مدونتك"
        actions={
          <>
            <Link href={`/author/${user.id}`} className={button.outline}>
              عرض مدونتي
            </Link>
            <Link href="/dashboard/posts/new" className={button.primary}>
              <FilePlus2 className="size-4" aria-hidden />
              تدوينة جديدة
            </Link>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${card} p-5`}>
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-bold">{formatNumber(stat.value)}</dd>
          </div>
        ))}
      </dl>

      {admin && (admin.pendingPosts > 0 || admin.pendingRequests > 0) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <AdminCard href="/admin/posts" label="تدوينات بانتظار المراجعة" value={admin.pendingPosts} />
          <AdminCard href="/admin/requests" label="طلبات مدونات جديدة" value={admin.pendingRequests} />
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className={`${card} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">آخر التدوينات</h2>
            <Link href="/dashboard/posts" className="text-sm font-medium text-brand hover:underline">
              عرض الكل
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="text-muted">
              لا توجد تدوينات بعد.{" "}
              <Link href="/dashboard/posts/new" className="text-brand hover:underline">
                اكتب تدوينتك الأولى
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {posts.slice(0, 5).map((post) => (
                <li key={post.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="min-w-0 flex-1 truncate font-medium hover:text-brand"
                  >
                    {post.title}
                  </Link>
                  <span className={`${badge} ${statusBadge[post.status]}`}>
                    {POST_STATUS_LABELS[post.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${card} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">آخر الإشعارات</h2>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-brand hover:underline">
              الكل
            </Link>
          </div>
          {notifications.items.length === 0 ? (
            <p className="text-muted">لا توجد إشعارات.</p>
          ) : (
            <ul className="space-y-4">
              {notifications.items.map((n) => (
                <li key={n.id}>
                  <p className={`text-sm leading-relaxed ${n.isRead ? "text-ink/70" : "font-medium"}`}>
                    {n.message}
                  </p>
                  <time dateTime={n.createdAt} className="text-xs text-muted">
                    {formatDateTime(n.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function AdminCard({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:shadow-sm"
    >
      <span className="font-medium text-amber-900">{label}</span>
      <span className="text-2xl font-bold text-amber-900">{formatNumber(value)}</span>
    </Link>
  );
}

async function adminCounts() {
  const [posts, requests] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("blog_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { pendingPosts: posts.count ?? 0, pendingRequests: requests.count ?? 0 };
}
