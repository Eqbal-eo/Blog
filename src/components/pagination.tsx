import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { button } from "@/components/ui/styles";

/** Previous / next links. `href(page)` builds the URL for a page. */
export function Pagination({
  page,
  pageCount,
  href,
}: {
  page: number;
  pageCount: number;
  href: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-10 flex items-center justify-between gap-4" aria-label="التنقل بين الصفحات">
      {page > 1 ? (
        <Link href={href(page - 1)} className={button.outline} rel="prev">
          <ChevronRight className="size-4" aria-hidden />
          الأحدث
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">
        صفحة {formatNumber(page)} من {formatNumber(pageCount)}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={button.outline} rel="next">
          الأقدم
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Reads ?page= safely (defaults to 1). */
export function pageParam(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}
