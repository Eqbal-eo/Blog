import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPosts } from "@/lib/data";
import { categoryLabel, isPostCategory, POST_CATEGORIES } from "@/lib/format";
import { PostGrid, PostGridSkeleton } from "@/components/post-card";
import { CategoryNav } from "@/components/category-nav";
import { Pagination, pageParam } from "@/components/pagination";

type Props = PageProps<"/category/[slug]">;

export async function generateStaticParams() {
  return POST_CATEGORIES.map(([slug]) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isPostCategory(slug)) return { title: "تصنيف غير موجود" };
  return {
    title: `تدوينات ${categoryLabel(slug)}`,
    description: `تدوينات تصنيف ${categoryLabel(slug)} في مدونات آفاق`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!isPostCategory(slug)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{categoryLabel(slug)}</h1>
      <div className="mt-6">
        <CategoryNav active={slug} />
      </div>
      <div className="mt-8">
        <Suspense fallback={<PostGridSkeleton count={6} />}>
          <CategoryPosts slug={slug} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function CategoryPosts({ slug, searchParams }: { slug: string } & Pick<Props, "searchParams">) {
  const page = pageParam((await searchParams).page);
  const { items, pageCount } = await getPublishedPosts({ page, category: slug });

  if (items.length === 0) return <p className="text-muted">لا توجد تدوينات في هذا التصنيف بعد.</p>;
  return (
    <>
      <PostGrid posts={items} />
      <Pagination
        page={page}
        pageCount={pageCount}
        href={(p) => (p === 1 ? `/category/${slug}` : `/category/${slug}?page=${p}`)}
      />
    </>
  );
}
