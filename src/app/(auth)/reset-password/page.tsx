import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { button } from "@/components/ui/styles";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة",
  robots: { index: false, follow: false },
};

type Props = PageProps<"/reset-password">;

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <AuthCard title="تعيين كلمة مرور جديدة">
      <Suspense fallback={null}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Content({ searchParams }: Pick<Props, "searchParams">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <div className="space-y-4">
        <p className="text-muted">الرابط ناقص أو غير صالح.</p>
        <Link href="/forgot-password" className={button.primary}>
          اطلب رابطاً جديداً
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}
