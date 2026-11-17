import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عن المنصة",
  description: "منصة آفاق مساحة حرة للتدوين الثقافي والفكري والسياسي",
};

const VALUES = ["التدوين الثقافي", "الحوار الفكري", "التعبير الحر", "المحتوى العربي"];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">
        عن منصة <span className="text-brand">آفاق</span>
      </h1>
      <div className="mt-6 space-y-4 text-lg leading-loose text-ink/80">
        <p>
          منصة &quot;آفاق&quot; هي مساحة حرة للتدوين الثقافي والفكري والسياسي، تهدف
          إلى تمكين الأفراد من التعبير عن آرائهم ومشاركة تجاربهم ومعارفهم مع
          مجتمع واسع ومتنوع.
        </p>
        <p>
          نؤمن بقوة الكلمة وأهمية الحوار البنّاء، ونوفر أدوات سهلة ومتطورة تساعد
          الكتّاب على نشر محتواهم بكل احترافية. انضم إلينا وساهم في بناء مجتمع
          فكري نابض بالحياة.
        </p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {VALUES.map((value) => (
          <li
            key={value}
            className="rounded-2xl border border-line bg-surface px-6 py-4 text-center font-medium"
          >
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
