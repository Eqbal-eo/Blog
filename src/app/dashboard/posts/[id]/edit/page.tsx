import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getUserPost, toEditorHtml } from "@/lib/posts";
import { sanitize } from "@/lib/sanitize";
import { POST_STATUS_LABELS } from "@/lib/format";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { badge, statusBadge } from "@/components/ui/styles";
import { PostForm } from "../../post-form";

export const metadata: Metadata = { title: "تعديل تدوينة" };

type Props = PageProps<"/dashboard/posts/[id]/edit">;

export default function EditPostPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditPost params={params} />
    </Suspense>
  );
}

async function EditPost({ params }: Pick<Props, "params">) {
  const [user, { id }] = await Promise.all([requireUser(), params]);
  const post = await getUserPost(user.id, id);
  if (!post) notFound();

  return (
    <>
      <PageHeader
        title="تعديل تدوينة"
        description={
          <span className={`${badge} ${statusBadge[post.status]}`}>
            {POST_STATUS_LABELS[post.status]}
          </span>
        }
      />
      <PostForm
        isAdmin={user.role === "admin"}
        post={{
          id: post.id,
          title: post.title,
          category: post.category,
          html: toEditorHtml(sanitize(post.content)),
          status: post.status,
          rejectionReason: post.rejectionReason,
        }}
      />
    </>
  );
}
