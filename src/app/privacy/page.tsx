import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "كيف تجمع منصة مدونات آفاق البيانات وتستخدمها وتحميها",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "٢٠ نوفمبر ٢٠٢٦";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 leading-loose text-ink/85">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
      <p className="mt-2 text-sm text-muted">آخر تحديث: {UPDATED}</p>
      <p className="mt-6 leading-loose text-ink/85">
        نحترم خصوصيتك. توضّح هذه الصفحة ما نجمعه من بيانات عند استخدامك منصة «مدونات آفاق»، ولماذا،
        وكيف نحميها، وما حقوقك تجاهها.
      </p>

      <Section title="ما الذي نجمعه">
        <ul className="list-disc space-y-2 ps-6">
          <li>
            <strong>طلبات الانضمام:</strong> الاسم والبريد الإلكتروني والتخصص والمقال التجريبي، لمراجعة
            الطلب والتواصل معك بشأنه.
          </li>
          <li>
            <strong>حسابات الكتّاب:</strong> اسم المستخدم، وكلمة المرور مخزّنة مشفّرة بخوارزمية bcrypt (لا
            يمكننا الاطلاع عليها)، والاسم المعروض والنبذة وإعدادات المدونة وصورة الملف الشخصي.
          </li>
          <li>
            <strong>التعليقات:</strong> الاسم ونص التعليق، والبريد إن أدخلته. البريد لا يُنشر أبداً.
          </li>
          <li>
            <strong>النشرة البريدية:</strong> بريدك والكاتب الذي تتابعه، بعد تأكيدك الاشتراك.
          </li>
          <li>
            <strong>الإحصائيات:</strong> نستخدم Vercel Analytics لعدّ زيارات الصفحات دون ملفات تعريف
            ارتباط (cookies) ودون تخزين عنوان IP. ولعدّ مشاهدات التدوينات نستخدم بصمة مجهولة لا يمكن
            إرجاعها إلى عنوانك.
          </li>
        </ul>
      </Section>

      <Section title="ملفات تعريف الارتباط">
        <p>
          نستخدم ملف تعريف ارتباط واحداً ضرورياً لإبقاء الكاتب مسجّل الدخول. ونحفظ في متصفحك تفضيلات
          العرض (الوضع الليلي وحجم الخط) فقط. لا نستخدم ملفات تتبّع أو إعلانات.
        </p>
      </Section>

      <Section title="مساعد الكتابة بالذكاء الاصطناعي">
        <p>
          عندما يضغط الكاتب «تدقيق لغوي» أو «اقتراح عنوان ووصف»، يُرسل نص المسودة إلى خدمة Claude من
          شركة Anthropic لتوليد الاقتراحات، ولا يُرسل إلا عند الضغط على الزر. لا نستخدم هذه البيانات لأي
          غرض آخر، والكاتب حر في قبول الاقتراحات أو تجاهلها.
        </p>
      </Section>

      <Section title="من يعالج البيانات معنا">
        <ul className="list-disc space-y-2 ps-6">
          <li>Supabase: قاعدة البيانات وتخزين الصور.</li>
          <li>Vercel: استضافة الموقع والإحصائيات.</li>
          <li>Brevo: إرسال رسائل البريد (أكواد التفعيل، والنشرة، واستعادة كلمة المرور).</li>
          <li>Anthropic: مساعد الكتابة، عند استخدامه فقط.</li>
        </ul>
        <p>لا نبيع بياناتك ولا نشاركها مع أي جهة لأغراض تسويقية.</p>
      </Section>

      <Section title="حقوقك">
        <ul className="list-disc space-y-2 ps-6">
          <li>
            <strong>الكتّاب:</strong> يمكنكم تعديل بياناتكم أو حذف الحساب وكل ما فيه نهائياً من صفحة
            الإعدادات.
          </li>
          <li>
            <strong>المشتركون:</strong> كل رسالة من النشرة تحتوي رابطاً لإلغاء الاشتراك فوراً.
          </li>
          <li>
            لطلب نسخة من بياناتك أو حذف تعليق أو أي استفسار آخر،{" "}
            <Link href="/contact" className="text-brand hover:underline">
              تواصل معنا
            </Link>
            .
          </li>
        </ul>
      </Section>

      <Section title="الحماية">
        <p>
          كل الاتصالات مشفّرة (HTTPS)، ولا يصل إلى قاعدة البيانات إلا خادم الموقع، مع ضوابط على عدد
          المحاولات لحماية الحسابات.
        </p>
      </Section>
    </article>
  );
}
