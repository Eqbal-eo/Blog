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
            <Link href="/forgot-password" className="font-medium text-brand hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </p>
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
      <DemoHint />
    </AuthCard>
  );
}

async function LoginFormWithRedirect({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { next, reset } = await searchParams;
  return (
    <>
      {reset === "1" && (
        <p role="status" className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          تم تعيين كلمة المرور الجديدة، سجّل الدخول بها.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}

/** Public demo credentials, shown when DEMO_PASSWORD is configured. */
function DemoHint() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return null;
  return (
    <div className="mt-6 rounded-xl border border-dashed border-line bg-paper p-4 text-sm">
      <p className="font-medium">تريد التجربة فقط؟</p>
      <p className="mt-1 text-muted">
        ادخل بالحساب التجريبي: اسم المستخدم{" "}
        <code dir="ltr" className="rounded bg-brand-soft px-1.5 py-0.5 text-brand">
          demo
        </code>{" "}
        وكلمة المرور{" "}
        <code dir="ltr" className="rounded bg-brand-soft px-1.5 py-0.5 text-brand">
          {password}
        </code>
      </p>
    </div>
  );
}
