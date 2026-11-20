import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Uploaded images (profile pictures, post images) live in Supabase Storage
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" }]
      : [],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Fonts read from disk by the share-image routes (src/lib/og-image.tsx)
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/**/*"],
    "/article/[id]/opengraph-image": ["./src/assets/fonts/**/*"],
  },
  experimental: {
    serverActions: {
      // Image uploads are capped at 5 MB in lib/media.ts
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // URLs from the legacy Express app, kept working for bookmarks and old emails
  async redirects() {
    return [
      { source: "/posts/create", destination: "/dashboard/posts/new", permanent: true },
      { source: "/posts/select-edit", destination: "/dashboard/posts", permanent: true },
      { source: "/posts/select-delete", destination: "/dashboard/posts", permanent: true },
      { source: "/settings", destination: "/dashboard/settings", permanent: true },
      { source: "/notifications", destination: "/dashboard/notifications", permanent: true },
      { source: "/admin/pending-posts", destination: "/admin/posts", permanent: true },
      { source: "/admin/posts/:id/preview", destination: "/admin/posts/:id", permanent: true },
      { source: "/admin/blog-requests", destination: "/admin/requests", permanent: true },
      { source: "/admin/visitors", destination: "/dashboard", permanent: false },
      { source: "/logout", destination: "/dashboard", permanent: false },
    ];
  },
};

// Sentry: source maps are uploaded only when SENTRY_AUTH_TOKEN, SENTRY_ORG and
// SENTRY_PROJECT are set (e.g. on Vercel); otherwise this changes nothing.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
