"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deletePosts } from "./actions";
import { categoryLabel, formatDate, formatNumber, POST_STATUS_LABELS } from "@/lib/format";
import { badge, button, card, statusBadge } from "@/components/ui/styles";

type Row = {
  id: string;
  title: string;
  status: string;
  category: string | null;
  createdAt: string;
  rejectionReason: string | null;
  viewCount: number;
};

const FILTERS = [
  ["all", "الكل"],
  ["published", "المنشورة"],
  ["pending", "قيد المراجعة"],
  ["draft", "المسودات"],
  ["rejected", "المرفوضة"],
] as const;

export function PostsTable({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = filter === "all" ? posts : posts.filter((p) => p.status === filter);
  const allSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(visible.map((p) => p.id)));

  const remove = (ids: string[]) => {
    const what = ids.length === 1 ? "هذه التدوينة" : `${ids.length} تدوينات`;
    if (!window.confirm(`هل تريد حذف ${what} نهائياً؟ لا يمكن التراجع عن ذلك.`)) return;
    startTransition(async () => {
      const result = await deletePosts(ids);
      setFeedback(result);
      if (result.ok) {
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([value, label]) => {
          const n = value === "all" ? posts.length : posts.filter((p) => p.status === value).length;
          if (value !== "all" && n === 0) return null;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFilter(value);
                setSelected(new Set());
              }}
              aria-pressed={filter === value}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                filter === value ? "bg-ink text-white" : "bg-surface text-ink/75 ring-1 ring-line hover:ring-ink/40"
              }`}
            >
              {label} ({n})
            </button>
          );
        })}

        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => remove([...selected])}
            disabled={pending}
            className={`${button.dangerOutline} ms-auto py-1.5`}
          >
            <Trash2 className="size-4" aria-hidden />
            حذف المحدد ({selected.size})
          </button>
        )}
      </div>

      {feedback && (
        <p
          role={feedback.ok ? "status" : "alert"}
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper text-start text-muted">
            <tr>
              <th scope="col" className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="تحديد الكل"
                  className="size-4 accent-brand"
                />
              </th>
              <th scope="col" className="p-3 text-start font-medium">العنوان</th>
              <th scope="col" className="hidden p-3 text-start font-medium sm:table-cell">التاريخ</th>
              <th scope="col" className="hidden p-3 text-start font-medium md:table-cell">المشاهدات</th>
              <th scope="col" className="p-3 text-start font-medium">الحالة</th>
              <th scope="col" className="p-3"><span className="sr-only">إجراءات</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((post) => (
              <tr key={post.id} className={selected.has(post.id) ? "bg-brand-soft/40" : undefined}>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(post.id)}
                    onChange={() => toggle(post.id)}
                    aria-label={`تحديد ${post.title}`}
                    className="size-4 accent-brand"
                  />
                </td>
                <td className="max-w-0 p-3">
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="block truncate font-medium hover:text-brand"
                  >
                    {post.title}
                  </Link>
                  {post.category && (
                    <span className="text-xs text-muted">{categoryLabel(post.category)}</span>
                  )}
                  {post.status === "rejected" && post.rejectionReason && (
                    <p className="mt-1 truncate text-xs text-red-700" title={post.rejectionReason}>
                      سبب الرفض: {post.rejectionReason}
                    </p>
                  )}
                </td>
                <td className="hidden p-3 whitespace-nowrap text-muted sm:table-cell">
                  {formatDate(post.createdAt)}
                </td>
                <td className="hidden p-3 text-muted md:table-cell">
                  {post.status === "published" ? formatNumber(post.viewCount) : "—"}
                </td>
                <td className="p-3">
                  <span className={`${badge} whitespace-nowrap ${statusBadge[post.status]}`}>
                    {POST_STATUS_LABELS[post.status]}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {post.status === "published" && (
                      <Link href={`/article/${post.id}`} className={button.ghost} title="عرض" aria-label={`عرض ${post.title}`}>
                        <ExternalLink className="size-4" aria-hidden />
                      </Link>
                    )}
                    <Link href={`/dashboard/posts/${post.id}/edit`} className={button.ghost} title="تعديل" aria-label={`تعديل ${post.title}`}>
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove([post.id])}
                      disabled={pending}
                      className={`${button.ghost} hover:bg-red-50 hover:text-red-700`}
                      title="حذف"
                      aria-label={`حذف ${post.title}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
