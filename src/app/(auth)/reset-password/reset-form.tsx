"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "../password-actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword.bind(null, token), initialFormState);
  const expired = state.status === "error" && state.message?.includes("انتهت صلاحيته");

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {expired && (
        <Link href="/forgot-password" className="block text-sm font-medium text-brand hover:underline">
          اطلب رابطاً جديداً
        </Link>
      )}
      <TextField
        name="new_password"
        label="كلمة المرور الجديدة"
        hint="10 أحرف على الأقل، حروف وأرقام"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        state={{ ...state, values: undefined }}
        required
        autoFocus
      />
      <TextField
        name="confirm_password"
        label="تأكيد كلمة المرور"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        state={{ ...state, values: undefined }}
        required
      />
      <SubmitButton className="w-full" pendingText="جارٍ الحفظ…">
        حفظ كلمة المرور
      </SubmitButton>
    </form>
  );
}
