import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getRequests, getRequestStats, REQUESTS_PAGE_SIZE } from "@/lib/requests";
import {
  categoryLabel,
  formatDate,
  formatNumber,
  REQUEST_CATEGORIES,
  REQUEST_STATUS_LABELS,
} from "@/lib/format";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { badge, button, card, input, statusBadge } from "@/components/ui/styles";

export const metadata: Metadata = { title: "طلبات المدونات" };

type Props = PageProps<"/admin/requests">;

const TABS = [
  ["pending", "قيد المراجعة"],
  ["approved", "المقبولة"],
  ["rejected", "المرفوضة"],
  ["all", "الكل"],
] as const;

export default function RequestsPage({ searchParams }: Props) {
  return (
    <>
      <PageHeader title="طلبات المدونات" description="طلبات الانضمام إلى المنصة كتّاباً" />
      <Suspense fallback={<PageSkeleton />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function href(params: { status: string; category?: string; page?: number }) {
  const q = new URLSearchParams({ status: params.status });
  if (params.category) q.set("category", params.category);
  if (params.page && params.page > 1) q.set("page", String(params.page));
  return `/admin/requests?${q}`;
}

async function Requests({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && TABS.some(([v]) => v === sp.status) ? sp.status : "pending";
  const category =
    typeof sp.category === "string" && REQUEST_CATEGORIES.some(([v]) => v === sp.category)
      ? sp.category
      : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ items, total }, stats] = await Promise.all([
    getRequests({ status: status === "all" ? undefined : status, category, page }),
    getRequestStats(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / REQUESTS_PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(([value, label]) => (
          <Link
            key={value}
            href={href({ status: value, category })}
            aria-current={status === value ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              status === value ? "bg-ink text-white" : "bg-surface text-ink/75 ring-1 ring-line hover:ring-ink/40"
            }`}
          >
            {label} ({formatNumber(value === "all" ? stats.total : stats[value] ?? 0)})
          </Link>
        ))}

        <form className="ms-auto flex items-center gap-2" action="/admin/requests">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="category" className="sr-only">الفئة</label>
          <select id="category" name="category" defaultValue={category ?? ""} className={`${input} py-1.5`}>
            <option value="">كل الفئات</option>
            {REQUEST_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className={`${button.outline} py-1.5`}>تصفية</button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-muted">
          لا توجد طلبات هنا.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/requests/${r.id}`} className={`${card} block h-full p-5 transition hover:shadow-md`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{r.fullName}</h2>
                    <p className="text-sm text-muted">
                      {r.specialty} · {formatNumber(r.experienceYears)} سنوات خبرة
                    </p>
                  </div>
                  <span className={`${badge} ${statusBadge[r.status]}`}>{REQUEST_STATUS_LABELS[r.status]}</span>
                </div>
                <p className="mt-3 text-sm">
                  <span className="text-muted">المقال التجريبي: </span>
                  {r.sampleTitle}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {categoryLabel(r.sampleCategory)} · {formatDate(r.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="صفحات الطلبات">
          {page > 1 ? (
            <Link href={href({ status, category, page: page - 1 })} className={button.outline}>السابق</Link>
          ) : <span />}
          <span className="text-sm text-muted">
            صفحة {formatNumber(page)} من {formatNumber(totalPages)}
          </span>
          {page < totalPages ? (
            <Link href={href({ status, category, page: page + 1 })} className={button.outline}>التالي</Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
