import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { countPendingComments } from "@/lib/comments";
import { DashboardNav } from "./dashboard-nav";

/** Two-column layout shared by /dashboard and /admin. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[14rem_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Suspense fallback={<NavSkeleton />}>
          <NavWithCounts />
        </Suspense>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className="flex gap-1 lg:flex-col" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-9 w-28 animate-pulse rounded-lg bg-line/60 lg:w-full" />
      ))}
    </div>
  );
}

async function NavWithCounts() {
  const user = await getCurrentUser();
  if (!user) return <DashboardNav isAdmin={false} />;

  const isAdmin = user.role === "admin";
  const [unread, pendingPosts, pendingRequests, pendingComments] = await Promise.all([
    getUnreadCount(user.id),
    isAdmin ? countRows("posts") : 0,
    isAdmin ? countRows("blog_requests") : 0,
    isAdmin ? countPendingComments() : 0,
  ]);

  return (
    <DashboardNav
      isAdmin={isAdmin}
      unread={unread}
      pendingPosts={pendingPosts}
      pendingRequests={pendingRequests}
      pendingComments={pendingComments}
    />
  );
}

async function countRows(table: "posts" | "blog_requests"): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-9 w-56 rounded-lg bg-line" />
      <div className="h-5 w-80 rounded bg-line/70" />
      <div className="mt-8 h-64 rounded-2xl bg-line/50" />
    </div>
  );
}
