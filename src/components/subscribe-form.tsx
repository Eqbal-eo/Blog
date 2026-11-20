"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { input } from "@/components/ui/styles";

/**
 * Email signup. With an `authorId` it follows one writer; without, every
 * new post on the site.
 */
export function SubscribeForm({
  authorId = null,
  title,
  description,
  compact = false,
}: {
  authorId?: string | null;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  const [state, action] = useActionState(subscribeToNewsletter.bind(null, authorId), initialFormState);

  return (
    <section className={compact ? "" : "rounded-2xl border border-line bg-surface p-6"}>
      <h2 className={`flex items-center gap-2 font-bold ${compact ? "text-base" : "text-lg"}`}>
        <Mail className="size-5 text-brand" aria-hidden />
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <p className="mt-1 text-xs text-muted">
        يمكنك إلغاء الاشتراك في أي وقت.{" "}
        <a href="/privacy" className="underline hover:text-brand">
          سياسة الخصوصية
        </a>
      </p>

      {state.status === "success" ? (
        <div className="mt-4">
          <FormMessage state={state} />
        </div>
      ) : (
        <form action={action} className="mt-4 space-y-3" noValidate>
          <FormMessage state={state} />
          <div className="flex flex-wrap gap-2">
            <label htmlFor={`subscribe-${authorId ?? "site"}`} className="sr-only">
              البريد الإلكتروني
            </label>
            <input
              id={`subscribe-${authorId ?? "site"}`}
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              placeholder="you@example.com"
              defaultValue={state.values?.email}
              required
              className={`${input} min-w-0 flex-1 py-2`}
            />
            {/* Honeypot, hidden from people */}
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <SubmitButton className="py-2" pendingText="…">
              اشترك
            </SubmitButton>
          </div>
        </form>
      )}
    </section>
  );
}
