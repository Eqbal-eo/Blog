import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { RequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "طلب إنشاء مدونة",
  description: "انضم إلى مجتمع الكتّاب والمفكرين في مدونات آفاق",
};

export default function BlogRequestPage() {
  return (
    <AuthCard
      wide
      title="طلب إنشاء مدونة"
      subtitle="املأ البيانات التالية، وسيراجع فريقنا طلبك خلال 2-3 أيام عمل"
      footer={
        <p>
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            سجّل الدخول
          </Link>
        </p>
      }
    >
      <RequestForm />
    </AuthCard>
  );
}
