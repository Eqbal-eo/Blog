import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PageHeader, PageSkeleton } from "@/components/dashboard-shell";
import { BlogForm, DeleteAccountForm, PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "الإعدادات" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="الإعدادات" />
      <Suspense fallback={<PageSkeleton />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const user = await requireUser();
  const { data: settings } = await supabase
    .from("settings")
    .select("blog_title, blog_description, about_text, contact_info, email")
    .eq("user_id", Number(user.id))
    .maybeSingle();

  return (
    <div className="space-y-6">
      <ProfileForm initial={{ display_name_ar: user.displayNameAr ?? "", bio: user.bio ?? "" }} />
      <BlogForm
        initial={{
          blog_title: settings?.blog_title ?? "",
          blog_description: settings?.blog_description ?? "",
          about_text: settings?.about_text ?? "",
          contact_info: settings?.contact_info ?? "",
          email: settings?.email ?? "",
        }}
      />
      <PasswordForm />
      <DeleteAccountForm />
    </div>
  );
}
