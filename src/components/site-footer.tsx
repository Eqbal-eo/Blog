import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <p>مدونات آفاق | منصة للتدوين الثقافي والفكري</p>
        <nav aria-label="روابط الموقع" className="flex gap-4">
          <Link href="/about" className="hover:text-brand">
            عن المنصة
          </Link>
          <Link href="/contact" className="hover:text-brand">
            تواصل معنا
          </Link>
          <Link href="/blog-request" className="hover:text-brand">
            انضم ككاتب
          </Link>
          <a href="/rss.xml" className="hover:text-brand">
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
