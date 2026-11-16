import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserPosts } from "@/lib/posts";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { button } from "@/components/ui/styles";
import { PostsTable } from "./posts-table";

export const metadata: Metadata = { title: "تدويناتي" };

const DONE_MESSAGES: Record<string, string> = {
  "saved-draft": "تم حفظ التدوينة كمسودة.",
  submitted: "تم إرسال التدوينة، وستظهر للقرّاء بعد موافقة المشرف.",
  published: "تم نشر التدوينة.",
};

export default function PostsPage({ searchParams }: PageProps<"/dashboard/posts">) {
  return (
    <>
      <PageHeader
        title="تدويناتي"
        actions={
          <Link href="/dashboard/posts/new" className={button.primary}>
            <FilePlus2 className="size-4" aria-hidden />
            تدوينة جديدة
          </Link>
        }
      />
      <Suspense fallback={<PageSkeleton />}>
        <Posts searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Posts({ searchParams }: Pick<PageProps<"/dashboard/posts">, "searchParams">) {
  const user = await requireUser();
  const [posts, { done }] = await Promise.all([getUserPosts(user.id), searchParams]);
  const message = typeof done === "string" ? DONE_MESSAGES[done] : undefined;

  return (
    <>
      {message && (
        <p role="status" className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="text-muted">لم تكتب أي تدوينة بعد.</p>
          <Link href="/dashboard/posts/new" className={`${button.primary} mt-4`}>
            اكتب تدوينتك الأولى
          </Link>
        </div>
      ) : (
        <PostsTable
          posts={posts.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            category: p.category,
            createdAt: p.createdAt,
            rejectionReason: p.rejectionReason,
          }))}
        />
      )}
    </>
  );
}
