"use client";

import { useActionState, useState } from "react";
import { changePassword, deleteAccount, updateBlogSettings, updateProfile } from "./actions";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { button, card } from "@/components/ui/styles";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className={`${card} p-6`}>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ProfileForm({ initial }: { initial: { display_name_ar: string; bio: string } }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  return (
    <Section title="الملف الشخصي" description="يظهر في بطاقة مدونتك وعلى تدويناتك">
      <form action={action} className="space-y-5" noValidate>
        <FormMessage state={state} />
        <TextField
          name="display_name_ar"
          label="الاسم المعروض"
          hint="يظهر بدلاً من اسم المستخدم"
          state={state}
          defaultValue={initial.display_name_ar}
          required
        />
        <TextAreaField name="bio" label="نبذة تعريفية" rows={3} state={state} defaultValue={initial.bio} />
        <SubmitButton pendingText="جارٍ الحفظ…">حفظ</SubmitButton>
      </form>
    </Section>
  );
}

export function BlogForm({
  initial,
}: {
  initial: { blog_title: string; blog_description: string; about_text: string; contact_info: string; email: string };
}) {
  const [state, action] = useActionState(updateBlogSettings, initialFormState);
  return (
    <Section title="إعدادات المدونة" description="تظهر في صفحة مدونتك العامة">
      <form action={action} className="space-y-5" noValidate>
        <FormMessage state={state} />
        <TextField name="blog_title" label="عنوان المدونة" state={state} defaultValue={initial.blog_title} />
        <TextField
          name="blog_description"
          label="وصف المدونة"
          hint="سطر يساعد القرّاء على فهم محتوى مدونتك"
          state={state}
          defaultValue={initial.blog_description}
        />
        <TextAreaField name="about_text" label="عن الكاتب" rows={5} state={state} defaultValue={initial.about_text} />
        <TextField
          name="email"
          label="بريد التواصل"
          hint="اختياري، ويظهر للقرّاء"
          type="email"
          dir="ltr"
          state={state}
          defaultValue={initial.email}
        />
        <TextAreaField
          name="contact_info"
          label="معلومات تواصل إضافية"
          hint="مثل حسابات التواصل الاجتماعي"
          rows={3}
          state={state}
          defaultValue={initial.contact_info}
        />
        <SubmitButton pendingText="جارٍ الحفظ…">حفظ</SubmitButton>
      </form>
    </Section>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, initialFormState);
  return (
    <Section title="كلمة المرور">
      <form action={action} className="space-y-5" noValidate>
        <FormMessage state={state} />
        <TextField
          name="current_password"
          label="كلمة المرور الحالية"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          state={{ ...state, values: undefined }}
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="new_password"
            label="كلمة المرور الجديدة"
            hint="10 أحرف على الأقل، حروف وأرقام"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            state={{ ...state, values: undefined }}
            required
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
        </div>
        <SubmitButton pendingText="جارٍ التغيير…">تغيير كلمة المرور</SubmitButton>
      </form>
    </Section>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, initialFormState);
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="text-lg font-bold text-red-800">حذف الحساب</h2>
      <p className="mt-1 text-sm text-red-900/80">
        يحذف حسابك وكل تدويناتك وإعداداتك نهائياً. لا يمكن التراجع عن هذا الإجراء.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={`${button.dangerOutline} mt-5`}>
          حذف الحساب
        </button>
      ) : (
        <form action={action} className="mt-5 space-y-4" noValidate>
          <FormMessage state={state} />
          <TextField
            name="password"
            label="أدخل كلمة المرور للتأكيد"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
            autoFocus
          />
          <div className="flex flex-wrap gap-3">
            <SubmitButton variant="danger" pendingText="جارٍ الحذف…">
              حذف الحساب نهائياً
            </SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className={button.ghost}>
              إلغاء
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
