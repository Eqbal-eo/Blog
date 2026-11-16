import type { MetadataRoute } from "next";
import { getBloggers, getPostIndex } from "@/lib/data";
import { POST_CATEGORIES } from "@/lib/format";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, writers] = await Promise.all([getPostIndex(), getBloggers()]);
  const latest = posts[0]?.updatedAt;

  return [
    { url: siteUrl("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/articles"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/blogs"), changeFrequency: "weekly", priority: 0.6 },
    { url: siteUrl("/about"), changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/blog-request"), changeFrequency: "yearly", priority: 0.4 },
    ...POST_CATEGORIES.map(([slug]) => ({
      url: siteUrl(`/category/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...writers
      .filter((w) => w.articlesCount > 0)
      .map((w) => ({ url: siteUrl(`/author/${w.id}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...posts.map((post) => ({
      url: siteUrl(`/article/${post.id}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
