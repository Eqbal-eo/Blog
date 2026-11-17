import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getInviteStatus, getRequest } from "@/lib/requests";
import {
  categoryLabel,
  formatDate,
  formatDateTime,
  formatNumber,
  REQUEST_STATUS_LABELS,
  wordCount,
} from "@/lib/format";
import { PageSkeleton } from "@/components/dashboard-shell";
import { badge, card, statusBadge } from "@/components/ui/styles";
import { approveRequest, rejectRequest, resendInviteCode } from "../../actions";
import { ResendCodeButton, ReviewControls } from "../../review-controls";

export const metadata: Metadata = { title: "طلب مدونة" };

type Props = PageProps<"/admin/requests/[id]">;

const DONE: Record<string, string> = {
  approved: "تم قبول الطلب، وأُرسل كود التفعيل إلى بريد المتقدم.",
  rejected: "تم رفض الطلب، وأُرسل السبب إلى بريد المتقدم.",
};

export default function RequestPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RequestDetails params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RequestDetails({ params, searchParams }: Props) {
  const [, { id }, { done }] = await Promise.all([requireAdmin(), params, searchParams]);
  const request = await getRequest(id);
  if (!request) notFound();

  const invite = request.status === "approved" ? await getInviteStatus(request.id) : null;
  const message = typeof done === "string" ? DONE[done] : undefined;

  return (
    <div className="space-y-6">
      <Link href="/admin/requests" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ArrowRight className="size-4" aria-hidden />
        كل الطلبات
      </Link>

      {message && (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{request.fullName}</h1>
          <p className="mt-1 text-muted">قُدّم في {formatDate(request.createdAt)}</p>
        </div>
        <span className={`${badge} ${statusBadge[request.status]}`}>{REQUEST_STATUS_LABELS[request.status]}</span>
      </header>

      {request.status === "pending" && (
        <ReviewControls
          approve={approveRequest.bind(null, request.id)}
          reject={rejectRequest.bind(null, request.id)}
          approveLabel="قبول وإرسال كود التفعيل"
          rejectLabel="رفض الطلب"
          rejectHint="سيُرسل هذا السبب إلى بريد المتقدم"
        />
      )}

      {request.status === "rejected" && request.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-bold">سبب الرفض</p>
          <p className="mt-1 whitespace-pre-line">{request.rejectionReason}</p>
        </div>
      )}

      {invite && (
        <div className={`${card} space-y-3 p-5`}>
          <p>
            {invite.isUsed
              ? `أنشأ المتقدم حسابه${invite.usedAt ? ` في ${formatDateTime(invite.usedAt)}` : ""}.`
              : invite.expired
                ? "انتهت صلاحية كود التفعيل دون أن يُستخدم."
                : `أُرسل كود التفعيل، وهو صالح حتى ${formatDateTime(invite.expiresAt)}.`}
          </p>
          {!invite.isUsed && <ResendCodeButton action={resendInviteCode.bind(null, request.id)} />}
        </div>
      )}

      <section className={`${card} p-6`}>
        <h2 className="mb-4 text-lg font-bold">بيانات المتقدم</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Info label="البريد الإلكتروني">
            <a href={`mailto:${request.email}`} dir="ltr" className="text-brand hover:underline">{request.email}</a>
          </Info>
          <Info label="التخصص">{request.specialty}</Info>
          <Info label="سنوات الخبرة">{formatNumber(request.experienceYears)}</Info>
          <Info label="فئة المقال">{categoryLabel(request.sampleCategory)}</Info>
        </dl>
        <div className="mt-6">
          <h3 className="text-sm text-muted">الدافع للانضمام</h3>
          <p className="mt-1 leading-relaxed whitespace-pre-line">{request.motivation}</p>
        </div>
      </section>

      <article className={`${card} p-6 sm:p-10`}>
        <p className="text-sm text-muted">
          المقال التجريبي · {formatNumber(wordCount(request.sampleContent))} كلمة
        </p>
        <h2 className="mt-2 text-2xl font-bold">{request.sampleTitle}</h2>
        <div className="mt-6 text-lg leading-loose whitespace-pre-line">{request.sampleContent}</div>
      </article>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
