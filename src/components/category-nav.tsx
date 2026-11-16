import Link from "next/link";
import { POST_CATEGORIES } from "@/lib/format";

/** Row of category links; `active` highlights the current one. */
export function CategoryNav({ active }: { active?: string }) {
  const items: [string, string, string][] = [
    ["all", "الكل", "/articles"],
    ...POST_CATEGORIES.map(([code, label]) => [code, label, `/category/${code}`] as [string, string, string]),
  ];
  return (
    <nav aria-label="التصنيفات" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2 whitespace-nowrap">
        {items.map(([code, label, href]) => {
          const current = (active ?? "all") === code;
          return (
            <li key={code}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`inline-block rounded-full px-4 py-1.5 text-sm transition ${
                  current ? "bg-ink text-paper" : "bg-surface text-ink/75 ring-1 ring-line hover:ring-ink/40"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
