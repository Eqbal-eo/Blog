import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/data";
import { PostGrid, PostGridSkeleton } from "@/components/post-card";
import { CategoryNav } from "@/components/category-nav";
import { Pagination, pageParam } from "@/components/pagination";

export const metadata: Metadata = {
  title: "كل التدوينات",
  description: "كل التدوينات المنشورة في مدونات آفاق، الأحدث أولاً",
  alternates: { canonical: "/articles" },
};

type Props = PageProps<"/articles">;

export default function ArticlesPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">كل التدوينات</h1>
      <div className="mt-6">
        <CategoryNav />
      </div>
      <div className="mt-8">
        <Suspense fallback={<PostGridSkeleton count={6} />}>
          <Articles searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Articles({ searchParams }: Pick<Props, "searchParams">) {
  const page = pageParam((await searchParams).page);
  const { items, pageCount } = await getPublishedPosts({ page });

  if (items.length === 0) return <p className="text-muted">لا توجد تدوينات في هذه الصفحة.</p>;
  return (
    <>
      <PostGrid posts={items} />
      <Pagination page={page} pageCount={pageCount} href={(p) => (p === 1 ? "/articles" : `/articles?page=${p}`)} />
    </>
  );
}
