"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, initialFormState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        name="username"
        label="اسم المستخدم"
        state={state}
        autoComplete="username"
        dir="ltr"
        required
        autoFocus
      />
      <TextField
        name="password"
        label="كلمة المرور"
        type="password"
        state={state}
        autoComplete="current-password"
        dir="ltr"
        required
      />
      <SubmitButton className="w-full" pendingText="جارٍ الدخول…">
        تسجيل الدخول
      </SubmitButton>
    </form>
  );
}
