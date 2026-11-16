"use client";

import { useActionState, useEffect } from "react";
import { recordView, submitComment } from "./actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";

/** Records one view after the article has rendered in a real browser. */
export function ViewBeacon({ postId }: { postId: string }) {
  useEffect(() => {
    void recordView(postId);
  }, [postId]);
  return null;
}

export function CommentForm({ postId, defaultName }: { postId: string; defaultName?: string }) {
  const [state, action] = useActionState(submitComment.bind(null, postId), initialFormState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <FormMessage state={state} />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6" noValidate>
      <h3 className="text-lg font-bold">أضف تعليقاً</h3>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="author_name" label="الاسم" state={state} defaultValue={defaultName} autoComplete="name" required />
        <TextField
          name="author_email"
          label="البريد الإلكتروني (اختياري)"
          hint="لا يُنشر"
          type="email"
          dir="ltr"
          state={state}
          autoComplete="email"
        />
      </div>
      <TextAreaField name="body" label="التعليق" rows={4} state={state} maxLength={3000} required />
      {/* Honeypot, hidden from people */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">تظهر التعليقات بعد مراجعة المشرف.</p>
        <SubmitButton pendingText="جارٍ الإرسال…">إرسال التعليق</SubmitButton>
      </div>
    </form>
  );
}
