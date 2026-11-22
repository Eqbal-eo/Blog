import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { confirmSubscription } from "../actions";
import { button } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "تأكيد الاشتراك",
  robots: { index: false, follow: false },
};

type Props = PageProps<"/newsletter/confirm">;

// The email links here; confirming takes a click (a POST), so mail scanners
// that open links don't subscribe people on their behalf.
export default function ConfirmPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Suspense fallback={null}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: Pick<Props, "searchParams">) {
  const { token, done } = await searchParams;

  if (done === "1") {
    return (
      <>
        <h1 className="text-2xl font-bold">تم تأكيد اشتراكك</h1>
        <p className="mt-3 text-muted">ستصلك التدوينات الجديدة على بريدك. يمكنك إلغاء الاشتراك من أي رسالة.</p>
        <Link href="/" className={`${button.primary} mt-8`}>الصفحة الرئيسية</Link>
      </>
    );
  }
  if (done === "0" || typeof token !== "string") {
    return (
      <>
        <h1 className="text-2xl font-bold">الرابط غير صالح</h1>
        <p className="mt-3 text-muted">ربما أُلغي هذا الاشتراك، أو أن الرابط ناقص.</p>
        <Link href="/" className={`${button.outline} mt-8`}>الصفحة الرئيسية</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-bold">تأكيد الاشتراك</h1>
      <p className="mt-3 text-muted">اضغط الزر لتبدأ بتلقي التدوينات الجديدة على بريدك.</p>
      <form action={confirmSubscription.bind(null, token)} className="mt-8">
        <SubmitButton pendingText="جارٍ التأكيد…">تأكيد الاشتراك</SubmitButton>
      </form>
    </>
  );
}
