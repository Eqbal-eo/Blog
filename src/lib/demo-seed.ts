import "server-only";
import { supabase } from "./supabase";
import { DEMO_USERNAME } from "./demo";

const SAMPLE_DRAFT = `<h2>مرحباً بك في الحساب التجريبي</h2>
<p>هذه مسودة تجريبية لتجربة محرر مدونات آفاق. عدّل النص كما تشاء، وجرّب أدوات التنسيق في الأعلى.</p>
<p>جرّب «مساعد الكتابة» أسفل المحرر: اضغط «تدقيق لغوي» ليقترح تصحيح الاخطاء الاملائية في هذه الفقرة، او «اقتراح عنوان ووصف» ليقترح عناوين بديلة لهذه المسوده.</p>
<blockquote>تُحذف كل التعديلات في الحساب التجريبي يومياً وتعود هذه المسودة كما كانت.</blockquote>`;

/**
 * Restores the demo account to its starting state: removes everything it
 * wrote and puts back one sample draft. Returns false if there is no demo
 * account.
 */
export async function resetDemoAccount(): Promise<boolean> {
  const { data: user } = await supabase.from("users").select("id").eq("username", DEMO_USERNAME).maybeSingle();
  if (!user) return false;

  const { data: posts } = await supabase.from("posts").select("id").eq("user_id", user.id);
  const ids = (posts ?? []).map((p) => p.id as number);
  if (ids.length > 0) {
    await supabase.from("notifications").delete().in("post_id", ids);
    await supabase.from("posts").delete().in("id", ids);
  }
  await supabase.from("notifications").delete().eq("user_id", user.id);

  await supabase.from("posts").insert([
    {
      user_id: user.id,
      title: "مسودة تجريبية: جرّب المحرر ومساعد الكتابة",
      category: "literature",
      content: SAMPLE_DRAFT,
      status: "draft",
      created_at: new Date().toISOString(),
    },
  ]);
  return true;
}
