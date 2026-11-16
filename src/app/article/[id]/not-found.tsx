import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">التدوينة غير موجودة</h1>
      <p className="mt-3 text-muted">ربما حُذفت أو لم تُنشر بعد.</p>
      <Link
        href="/"
        className="mt-6 inline-block font-medium text-brand hover:underline"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
