"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "../password-actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <TextField
        name="email"
        label="البريد الإلكتروني"
        type="email"
        hint="البريد الذي سجّلت به، أو بريد التواصل في إعدادات مدونتك"
        autoComplete="email"
        dir="ltr"
        state={state}
        required
        autoFocus
      />
      <SubmitButton className="w-full" pendingText="جارٍ الإرسال…">
        أرسل الرابط
      </SubmitButton>
    </form>
  );
}
