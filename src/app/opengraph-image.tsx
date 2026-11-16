import { OG_SIZE, ogCard } from "@/lib/og-image";

export const alt = "مدونات آفاق";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogCard({
    eyebrow: "مدونات آفاق",
    title: "منصة للتدوين الفكري والثقافي والسياسي تجمع أصواتًا متعددة في مكان واحد",
  });
}
