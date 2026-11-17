import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribe } from "../actions";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "إلغاء الاشتراك",
  robots: { index: false, follow: false },
};

type Props = PageProps<"/newsletter/unsubscribe">;

export default function UnsubscribePage({ searchParams }: Props) {
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
        <h1 className="text-2xl font-bold">تم إلغاء اشتراكك</h1>
        <p className="mt-3 text-muted">لن تصلك رسائل أخرى على هذا الاشتراك.</p>
        <Link href="/" className={`${button.outline} mt-8`}>الصفحة الرئيسية</Link>
      </>
    );
  }
  if (typeof token !== "string") {
    return (
      <>
        <h1 className="text-2xl font-bold">الرابط غير صالح</h1>
        <Link href="/" className={`${button.outline} mt-8`}>الصفحة الرئيسية</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-bold">إلغاء الاشتراك</h1>
      <p className="mt-3 text-muted">هل تريد التوقف عن تلقي التدوينات الجديدة على بريدك؟</p>
      <form action={unsubscribe.bind(null, token)} className="mt-8">
        <button type="submit" className={button.danger}>إلغاء الاشتراك</button>
      </form>
    </>
  );
}
