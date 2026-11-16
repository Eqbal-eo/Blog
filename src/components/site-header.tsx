import { Suspense } from "react";
import Link from "next/link";
import { Bell, LogOut, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { logout } from "@/app/(auth)/actions";
import { button } from "@/components/ui/styles";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/articles", label: "التدوينات" },
  { href: "/blogs", label: "الكتّاب" },
  { href: "/about", label: "عن المنصة" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          مدونات <span className="text-brand">آفاق</span>
        </Link>

        <nav aria-label="الرئيسية" className="order-3 flex w-full gap-1 text-sm sm:order-none sm:w-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-ink/80 transition hover:bg-brand-soft hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link href="/search" className={button.ghost} aria-label="البحث" title="البحث">
            <Search className="size-5" aria-hidden />
          </Link>
          <ThemeToggle />
          {/* Reads the session cookie, so it streams in after the static shell */}
          <Suspense fallback={<GuestLinks />}>
            <AccountLinks />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

function GuestLinks() {
  return (
    <>
      <Link href="/login" className={`${button.outline} py-2`}>
        تسجيل الدخول
      </Link>
      <Link href="/blog-request" className={`${button.primary} py-2`}>
        انضم ككاتب
      </Link>
    </>
  );
}

async function AccountLinks() {
  const user = await getCurrentUser();
  if (!user) return <GuestLinks />;

  const unread = await getUnreadCount(user.id);

  return (
    <>
      <Link
        href="/dashboard/notifications"
        className={`${button.ghost} relative`}
        aria-label={unread > 0 ? `الإشعارات (${unread} جديدة)` : "الإشعارات"}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-5 rounded-full bg-brand px-1 text-center text-xs leading-5 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
      <Link href="/dashboard" className={`${button.primary} py-2`}>
        لوحة التحكم
      </Link>
      <form action={logout}>
        <button type="submit" className={button.ghost} aria-label="تسجيل الخروج" title="تسجيل الخروج">
          <LogOut className="size-5" aria-hidden />
        </button>
      </form>
    </>
  );
}
