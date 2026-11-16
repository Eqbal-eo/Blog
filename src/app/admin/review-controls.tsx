"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/forms";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextAreaField } from "@/components/ui/form";
import { button, card } from "@/components/ui/styles";

/**
 * Approve / reject controls shared by post review and blog request review.
 * `approve` takes no form data; `reject` reads a `reason` field.
 */
export function ReviewControls({
  approve,
  reject,
  approveLabel,
  rejectLabel,
  rejectHint,
}: {
  approve: () => Promise<FormState>;
  reject: (prev: FormState, formData: FormData) => Promise<FormState>;
  approveLabel: string;
  rejectLabel: string;
  rejectHint: string;
}) {
  const [approveState, approveAction] = useActionState(approve, initialFormState);
  const [rejectState, rejectAction] = useActionState(reject, initialFormState);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className={`${card} space-y-4 p-6`}>
      <FormMessage state={approveState} />
      {!rejecting ? (
        <div className="flex flex-wrap gap-3">
          <form action={approveAction}>
            <SubmitButton pendingText="جارٍ التنفيذ…">{approveLabel}</SubmitButton>
          </form>
          <button type="button" onClick={() => setRejecting(true)} className={button.dangerOutline}>
            {rejectLabel}
          </button>
        </div>
      ) : (
        <form action={rejectAction} className="space-y-4" noValidate>
          <FormMessage state={rejectState} />
          <TextAreaField
            name="reason"
            label="سبب الرفض"
            hint={rejectHint}
            rows={4}
            state={rejectState}
            required
            autoFocus
          />
          <div className="flex flex-wrap gap-3">
            <SubmitButton variant="danger" pendingText="جارٍ الإرسال…">
              {rejectLabel}
            </SubmitButton>
            <button type="button" onClick={() => setRejecting(false)} className={button.ghost}>
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function ResendCodeButton({ action }: { action: () => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <SubmitButton variant="outline" pendingText="جارٍ الإرسال…">
        إرسال كود تفعيل جديد
      </SubmitButton>
    </form>
  );
}
