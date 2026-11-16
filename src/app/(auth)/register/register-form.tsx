"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "../actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form";
import { button } from "@/components/ui/styles";

export function RegisterForm() {
  const [state, action] = useActionState(register, initialFormState);

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <FormMessage state={state} />
        <p className="leading-relaxed text-muted">
          ستجد في البريد اسم المستخدم وكلمة مرور مؤقتة. سجّل الدخول بها ثم غيّر كلمة
          المرور من صفحة الإعدادات.
        </p>
        <Link href="/login" className={`${button.primary} w-full`}>
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <TextField
        name="username"
        label="اسم المستخدم"
        state={state}
        hint="بالأحرف الإنجليزية، وستستخدمه لتسجيل الدخول"
        autoComplete="username"
        dir="ltr"
        required
      />
      <TextField
        name="email"
        label="البريد الإلكتروني"
        type="email"
        state={state}
        hint="نفس البريد الذي قدّمت به طلب المدونة"
        autoComplete="email"
        dir="ltr"
        required
      />
      <TextField
        name="invite_code"
        label="كود التفعيل"
        state={state}
        hint="الكود المرسل إليك عبر البريد الإلكتروني بعد قبول طلبك"
        autoComplete="one-time-code"
        dir="ltr"
        className="block w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.3em] uppercase focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        maxLength={12}
        required
      />
      <SubmitButton className="w-full" pendingText="جارٍ إنشاء الحساب…">
        إكمال التسجيل
      </SubmitButton>
    </form>
  );
}
