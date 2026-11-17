import { getPost } from "@/lib/data";
import { categoryLabel } from "@/lib/format";
import { OG_SIZE, ogCard } from "@/lib/og-image";

export const alt = "صورة مشاركة التدوينة";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return ogCard({ title: "منصة للتدوين الفكري والثقافي" });

  return ogCard({
    eyebrow: post.category ? categoryLabel(post.category) : undefined,
    title: post.title,
    footer: post.authorName,
  });
}
