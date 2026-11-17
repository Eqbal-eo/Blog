/** Absolute URL on the public site (WEBSITE_URL), for feeds, sitemaps and emails. */
export function siteUrl(path = ""): string {
  const base = (process.env.WEBSITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export const SITE_NAME = "مدونات آفاق";
export const SITE_DESCRIPTION =
  "منصة للتدوين الفكري والثقافي والسياسي تجمع أصواتًا متعددة في مكان واحد";
