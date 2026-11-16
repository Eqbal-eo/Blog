import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/newsletter", "/search", "/login", "/register"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
