import { Suspense } from "react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { sanitize } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "معلومات التواصل مع إدارة منصة مدونات آفاق",
};

/** Contact details come from the site admin's blog settings. */
async function getSiteContact() {
  "use cache";
  cacheLife("hours");
  cacheTag("site-settings");

  const { data: admin } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin")
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!admin) return null;

  const { data } = await supabase
    .from("settings")
    .select("contact_info, email")
    .eq("user_id", admin.id)
    .maybeSingle();

  return { html: sanitize(data?.contact_info), email: data?.email || null };
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">تواصل معنا</h1>
      <p className="mt-3 leading-relaxed text-muted">
        لأي استفسار أو اقتراح بخصوص المنصة، يسعدنا تواصلك معنا.
      </p>
      <Suspense fallback={<div className="mt-8 h-32 animate-pulse rounded-2xl bg-line/50" />}>
        <ContactDetails />
      </Suspense>
    </div>
  );
}

async function ContactDetails() {
  const contact = await getSiteContact();
  if (!contact || (!contact.html && !contact.email)) {
    return <p className="mt-8 text-muted">لم تُضف معلومات التواصل بعد.</p>;
  }
  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6">
      {contact.email && (
        <a href={`mailto:${contact.email}`} className="flex items-center gap-3 font-medium text-brand hover:underline">
          <Mail className="size-5" aria-hidden />
          <span dir="ltr">{contact.email}</span>
        </a>
      )}
      {contact.html && (
        <div className="leading-relaxed whitespace-pre-line text-ink/80" dangerouslySetInnerHTML={{ __html: contact.html }} />
      )}
    </div>
  );
}
