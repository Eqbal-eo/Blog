import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = { title: "تم إرسال الطلب" };

const STEPS = [
  { title: "تم إرسال الطلب", when: "اليوم", done: true },
  { title: "مراجعة الطلب", when: "2-3 أيام عمل", done: false },
  { title: "إرسال كود التفعيل", when: "عند الموافقة", done: false },
  { title: "إنشاء الحساب", when: "باستخدام الكود", done: false },
];

export default function RequestSentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CircleCheck className="mx-auto size-14 text-emerald-600" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold">تم إرسال طلبك بنجاح!</h1>
      <p className="mt-3 leading-relaxed text-muted">
        شكراً لاختيارك مدونات آفاق. سيدرس فريق المراجعة طلبك، وفي حال الموافقة ستصلك رسالة
        على بريدك الإلكتروني فيها كود التفعيل.
      </p>

      <ol className="mt-10 grid gap-3 text-start sm:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className={`rounded-xl border p-4 ${
              step.done ? "border-emerald-200 bg-emerald-50" : "border-line bg-surface"
            }`}
          >
            <span className="text-sm text-muted">{index + 1}</span>
            <p className="mt-1 font-medium">{step.title}</p>
            <p className="text-sm text-muted">{step.when}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className={button.outline}>
          الصفحة الرئيسية
        </Link>
        <Link href="/register" className={button.primary}>
          لديك كود؟ أكمل التسجيل
        </Link>
      </div>
    </div>
  );
}
