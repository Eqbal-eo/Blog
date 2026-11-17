import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getBloggers } from "@/lib/data";
import { categoryLabel, postsCount } from "@/lib/format";
import { Avatar } from "@/components/avatar";

export const metadata: Metadata = {
  title: "المدونات",
  description: "تصفّح مدونات كتّاب منصة آفاق",
};

export default function BlogsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">المدونات</h1>
      <p className="mt-2 text-muted">كتّاب المنصة ومدوناتهم</p>
      <div className="mt-8">
        <Suspense fallback={<BloggersSkeleton />}>
          <Bloggers />
        </Suspense>
      </div>
    </div>
  );
}

async function Bloggers() {
  const bloggers = await getBloggers();

  if (bloggers.length === 0) {
    return <p className="text-muted">لا توجد مدونات بعد.</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {bloggers.map((blogger) => (
        <li key={blogger.id}>
          <Link
            href={`/author/${blogger.id}`}
            className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Avatar src={blogger.avatar} name={blogger.name} size={52} />
              <div>
                <h2 className="text-lg font-bold">{blogger.name}</h2>
                <p className="text-sm text-brand">{postsCount(blogger.articlesCount)}</p>
              </div>
            </div>
            <p className="mt-3 flex-1 leading-relaxed text-ink/75">
              {blogger.bio ?? "لم يتم إضافة نبذة بعد"}
            </p>
            {blogger.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {blogger.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand"
                  >
                    {categoryLabel(category)}
                  </span>
                ))}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BloggersSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}
