"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardCheck,
  FilePlus2,
  Files,
  Inbox,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const WRITER: Item[] = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/posts", label: "تدويناتي", icon: Files, exact: true },
  { href: "/dashboard/posts/new", label: "تدوينة جديدة", icon: FilePlus2 },
  { href: "/dashboard/notifications", label: "الإشعارات", icon: Bell },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

const ADMIN: Item[] = [
  { href: "/admin/posts", label: "مراجعة التدوينات", icon: ClipboardCheck },
  { href: "/admin/requests", label: "طلبات المدونات", icon: Inbox },
];

export function DashboardNav({
  isAdmin,
  unread = 0,
  pendingPosts = 0,
  pendingRequests = 0,
}: {
  isAdmin: boolean;
  unread?: number;
  pendingPosts?: number;
  pendingRequests?: number;
}) {
  const pathname = usePathname();
  const counts: Record<string, number> = {
    "/dashboard/notifications": unread,
    "/admin/posts": pendingPosts,
    "/admin/requests": pendingRequests,
  };

  const render = (item: Item) => {
    const active = item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const count = counts[item.href] ?? 0;
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
            active
              ? "bg-brand-soft font-medium text-brand"
              : "text-ink/75 hover:bg-brand-soft/60 hover:text-brand"
          }`}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span>{item.label}</span>
          {count > 0 && (
            <span className="ms-auto rounded-full bg-brand px-2 py-0.5 text-xs text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="لوحة التحكم" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      <ul className="flex gap-1 lg:flex-col">{WRITER.map(render)}</ul>
      {isAdmin && (
        <>
          <p className="mt-4 mb-1 hidden px-3 text-xs font-medium text-muted lg:block">الإشراف</p>
          <ul className="flex gap-1 border-s border-line ps-1 lg:flex-col lg:border-0 lg:ps-0">
            {ADMIN.map(render)}
          </ul>
        </>
      )}
    </nav>
  );
}
