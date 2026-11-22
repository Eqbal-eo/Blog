"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import {
  changePassword,
  deleteAccount,
  updateBlogSettings,
  updateProfile,
  updateProfileImage,
} from "./actions";
import { initialFormState } from "@/lib/forms";
import { prepareImage } from "@/lib/image-upload";
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

function ProfileImageForm({ image, name }: { image: string | null; name: string }) {
  const [state, action, pending] = useActionState(updateProfileImage, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // Ignore old relative "/uploads/…" paths from the Express app (files are gone)
  const shown = preview ?? (image?.startsWith("https://") ? image : null);

  return (
    <form ref={form} action={action} className="mb-6 flex flex-wrap items-center gap-5">
      <div className="relative">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview (blob: URL)
          <img src={shown} alt="" className="size-20 rounded-full object-cover ring-1 ring-line" />
        ) : (
          <span
            role="img"
            aria-label={`لا توجد صورة لـ ${name}`}
            className="flex size-20 items-center justify-center rounded-full bg-brand-soft text-brand"
          >
            <UserRound className="size-10" aria-hidden />
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <label className={`${button.outline} cursor-pointer py-2 ${pending ? "pointer-events-none opacity-60" : ""}`}>
            <Camera className="size-4" aria-hidden />
            {pending ? "جارٍ الرفع…" : shown ? "تغيير الصورة" : "إضافة صورة"}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (event) => {
                const field = event.currentTarget;
                const file = field.files?.[0];
                if (!file) return;
                setFileError(null);
                const prepared = await prepareImage(file, 800);
                if (!prepared.ok) {
                  field.value = "";
                  setFileError(prepared.message);
                  return;
                }
                if (prepared.file !== file) {
                  // The form sends the input's file, so swap in the smaller one
                  const transfer = new DataTransfer();
                  transfer.items.add(prepared.file);
                  field.files = transfer.files;
                }
                setPreview(URL.createObjectURL(prepared.file));
                form.current?.requestSubmit();
              }}
            />
          </label>
          {shown && !preview && (
            <button
              type="submit"
              name="remove"
              value="1"
              disabled={pending}
              className={button.ghost}
              onClick={() => setPreview(null)}
            >
              إزالة
            </button>
          )}
        </div>
        <p className="text-sm text-muted">صورة مربعة، ونصغّر الصور الكبيرة تلقائياً</p>
        {fileError ? (
          <p role="alert" className="text-sm text-red-700">{fileError}</p>
        ) : (
          state.status !== "idle" && <FormMessage state={state} />
        )}
      </div>
    </form>
  );
}

export function ProfileForm({
  initial,
  image,
}: {
  initial: { display_name_ar: string; bio: string };
  image: string | null;
}) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  return (
    <Section title="الملف الشخصي" description="يظهر في بطاقة مدونتك وعلى تدويناتك">
      <ProfileImageForm image={image} name={initial.display_name_ar} />
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
