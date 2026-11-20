// Creates (or resets the password of) the public demo account.
//
//   node --env-file=.env scripts/create-demo-account.mjs
//
// Uses DEMO_PASSWORD from the environment. The password is public by design:
// show it on the login page and in the README. The account can only write
// drafts; everything it writes is reset daily by /api/cron/reset-demo.

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEMO_PASSWORD) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const password = await bcrypt.hash(DEMO_PASSWORD, 12);

const { data: existing } = await supabase.from("users").select("id").eq("username", "demo").maybeSingle();

let id = existing?.id;
if (id) {
  await supabase.from("users").update({ password }).eq("id", id);
  console.log("Demo account exists; password updated.");
} else {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        username: "demo",
        password,
        display_name_ar: "كاتب تجريبي",
        bio: "حساب تجريبي لاستكشاف لوحة الكاتب في مدونات آفاق.",
        role: "user",
      },
    ])
    .select("id")
    .single();
  if (error) {
    console.error("Could not create the demo account:", error.message);
    process.exit(1);
  }
  id = data.id;
  await supabase.from("settings").insert([
    { user_id: id, blog_title: "مدونة تجريبية", blog_description: "حساب للتجربة فقط", about_text: "", contact_info: "" },
  ]);
  console.log("Demo account created.");
}

// Start with the sample draft
const { data: posts } = await supabase.from("posts").select("id").eq("user_id", id);
if (!posts?.length) {
  await supabase.from("posts").insert([
    {
      user_id: id,
      title: "مسودة تجريبية: جرّب المحرر ومساعد الكتابة",
      category: "literature",
      content:
        "<h2>مرحباً بك في الحساب التجريبي</h2><p>هذه مسودة تجريبية لتجربة محرر مدونات آفاق. عدّل النص كما تشاء، وجرّب أدوات التنسيق في الأعلى.</p><p>جرّب «مساعد الكتابة» أسفل المحرر: اضغط «تدقيق لغوي» ليقترح تصحيح الاخطاء الاملائية في هذه الفقرة، او «اقتراح عنوان ووصف» ليقترح عناوين بديلة لهذه المسوده.</p><blockquote>تُحذف كل التعديلات في الحساب التجريبي يومياً وتعود هذه المسودة كما كانت.</blockquote>",
      status: "draft",
      created_at: new Date().toISOString(),
    },
  ]);
}
console.log("Done. Username: demo");
