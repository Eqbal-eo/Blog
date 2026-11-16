import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.WEBSITE_URL || "http://localhost:3000"),
  title: {
    default: "مدونات آفاق",
    template: "%s | مدونات آفاق",
  },
  description:
    "منصة للتدوين الفكري والثقافي والسياسي تجمع أصواتًا متعددة في مكان واحد",
  openGraph: { siteName: "مدونات آفاق", locale: "ar_AR", type: "website" },
  alternates: { types: { "application/rss+xml": [{ url: "/rss.xml", title: "مدونات آفاق" }] } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script adds a class before hydration, hence suppressHydrationWarning
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          تخطَّ إلى المحتوى
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* Page views (no cookies, no stored IPs); shows in the Vercel dashboard */}
        <Analytics />
      </body>
    </html>
  );
}
