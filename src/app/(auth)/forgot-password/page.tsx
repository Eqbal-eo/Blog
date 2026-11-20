import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "نسيت كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="نسيت كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني، وسنرسل لك رابطاً لتعيين كلمة مرور جديدة"
      footer={
        <p>
          تذكّرتها؟{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            سجّل الدخول
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
