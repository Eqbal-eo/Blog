import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "إكمال التسجيل" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="إكمال التسجيل"
      subtitle="أدخل بياناتك وكود التفعيل لإنشاء حسابك"
      footer={
        <>
          <p>
            ليس لديك كود؟{" "}
            <Link href="/blog-request" className="font-medium text-brand hover:underline">
              اطلب إنشاء مدونة
            </Link>
          </p>
          <p>
            لديك حساب؟{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              سجّل الدخول
            </Link>
          </p>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
