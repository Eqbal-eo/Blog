import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-muted">لم نعثر على الصفحة التي تبحث عنها.</p>
      <Link
        href="/"
        className="mt-6 inline-block font-medium text-brand hover:underline"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
