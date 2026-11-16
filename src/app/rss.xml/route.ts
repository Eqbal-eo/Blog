import { getPostIndex } from "@/lib/data";
import { categoryLabel } from "@/lib/format";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

const xml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Characters that are not allowed anywhere in XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/** RSS 2.0 feed of the 50 newest posts. */
export async function GET() {
  const posts = (await getPostIndex(50)).slice(0, 50);

  const items = posts
    .map(
      (post) => `    <item>
      <title>${xml(post.title)}</title>
      <link>${siteUrl(`/article/${post.id}`)}</link>
      <guid isPermaLink="true">${siteUrl(`/article/${post.id}`)}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <dc:creator>${xml(post.authorName)}</dc:creator>
${post.category ? `      <category>${xml(categoryLabel(post.category))}</category>\n` : ""}      <description>${xml(post.excerpt)}</description>
    </item>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(SITE_NAME)}</title>
    <link>${siteUrl("/")}</link>
    <description>${xml(SITE_DESCRIPTION)}</description>
    <language>ar</language>
    <atom:link href="${siteUrl("/rss.xml")}" rel="self" type="application/rss+xml"/>
${posts[0] ? `    <lastBuildDate>${new Date(posts[0].createdAt).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
}
