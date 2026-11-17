import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "تدوينة جديدة" };

export default function NewPostPage() {
  return (
    <>
      <PageHeader title="تدوينة جديدة" />
      <Suspense fallback={<PageSkeleton />}>
        <NewPost />
      </Suspense>
    </>
  );
}

async function NewPost() {
  const user = await requireUser();
  return <PostForm isAdmin={user.role === "admin"} />;
}
