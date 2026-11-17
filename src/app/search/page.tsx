import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { searchPosts } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { PostGrid, PostGridSkeleton } from "@/components/post-card";
import { Pagination, pageParam } from "@/components/pagination";
import { button, input } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "البحث",
  robots: { index: false, follow: true },
};

type Props = PageProps<"/search">;

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">البحث في التدوينات</h1>
      <Suspense fallback={<SearchForm />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function SearchForm({ query = "" }: { query?: string }) {
  return (
    <form action="/search" role="search" className="mt-6 flex max-w-2xl gap-2">
      <label htmlFor="q" className="sr-only">كلمات البحث</label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="ابحث في العناوين والمحتوى…"
        className={`${input} flex-1`}
        maxLength={200}
        autoFocus={!query}
      />
      <button type="submit" className={button.primary}>
        <Search className="size-4" aria-hidden />
        بحث
      </button>
    </form>
  );
}

async function Results({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const page = pageParam(params.page);

  if (!query) return <SearchForm />;

  return (
    <>
      <SearchForm query={query} />
      <div className="mt-8">
        <Suspense key={`${query}:${page}`} fallback={<PostGridSkeleton count={3} />}>
          <ResultList query={query} page={page} />
        </Suspense>
      </div>
    </>
  );
}

async function ResultList({ query, page }: { query: string; page: number }) {
  const result = await searchPosts(query, page);

  if (result.unavailable) {
    return <p className="text-muted">البحث غير متاح حالياً.</p>;
  }
  if (result.total === 0) {
    return (
      <p className="text-muted">
        لا توجد نتائج لـ «{query}». جرّب كلمات أقل أو أكثر عموماً.
      </p>
    );
  }
  return (
    <>
      <p className="mb-6 text-sm text-muted">
        {formatNumber(result.total)} نتيجة لـ «{query}»
      </p>
      <PostGrid posts={result.items} />
      <Pagination
        page={page}
        pageCount={result.pageCount}
        href={(p) => `/search?q=${encodeURIComponent(query)}${p > 1 ? `&page=${p}` : ""}`}
      />
    </>
  );
}
