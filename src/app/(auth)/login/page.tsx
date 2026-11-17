import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="مرحباً بعودتك إلى مدونات آفاق"
      footer={
        <>
          <p>
            ليس لديك حساب؟{" "}
            <Link href="/blog-request" className="font-medium text-brand hover:underline">
              اطلب إنشاء مدونة
            </Link>
          </p>
          <p>
            لديك كود تفعيل؟{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              أكمل التسجيل
            </Link>
          </p>
        </>
      }
    >
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithRedirect searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithRedirect({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
