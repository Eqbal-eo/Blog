"use client";

import { useActionState, useState } from "react";
import { submitBlogRequest } from "../actions";
import { initialFormState } from "@/lib/forms";
import { REQUEST_CATEGORIES, formatNumber, wordCount } from "@/lib/format";
import {
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/ui/form";

const EXPERIENCE = [
  ["1", "سنة واحدة"],
  ["2", "سنتان"],
  ["3", "3 سنوات"],
  ["4", "4 سنوات"],
  ["5", "5 سنوات"],
  ["10", "أكثر من 5 سنوات"],
] as const;

const MIN_WORDS = 300;

export function RequestForm() {
  const [state, action] = useActionState(submitBlogRequest, initialFormState);
  const [words, setWords] = useState(() => wordCount(state.values?.sample_content ?? ""));

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormMessage state={state} />

      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-bold">المعلومات الشخصية</legend>
        <TextField name="full_name" label="الاسم الكامل" state={state} autoComplete="name" required />
        <TextField
          name="email"
          label="البريد الإلكتروني"
          type="email"
          state={state}
          hint="سنرسل إليه نتيجة المراجعة وكود التفعيل"
          autoComplete="email"
          dir="ltr"
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="specialty"
            label="مجال التخصص"
            state={state}
            placeholder="مثال: التاريخ الإسلامي"
            required
          />
          <SelectField
            name="experience_years"
            label="سنوات الخبرة في المجال"
            state={state}
            options={EXPERIENCE}
            placeholder="اختر عدد سنوات الخبرة"
            required
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-1 text-lg font-bold">نموذج مقال تجريبي</legend>
        <p className="text-sm text-muted">اكتب مقالاً قصيراً كنموذج ليراجعه المشرفون.</p>
        <TextField name="sample_title" label="عنوان المقال" state={state} required />
        <SelectField
          name="sample_category"
          label="الفئة"
          state={state}
          options={REQUEST_CATEGORIES}
          placeholder="اختر الفئة المناسبة"
          required
        />
        <TextAreaField
          name="sample_content"
          label="نص المقال"
          state={state}
          rows={14}
          onChange={(event) => setWords(wordCount(event.target.value))}
          hint={
            <span className={words >= MIN_WORDS ? "text-emerald-700" : undefined}>
              {formatNumber(words)} من {formatNumber(MIN_WORDS)} كلمة على الأقل
            </span>
          }
          required
        />
      </fieldset>

      <TextAreaField
        name="motivation"
        label="لماذا تريد الانضمام إلى مدونات آفاق؟"
        state={state}
        rows={4}
        required
      />

      <SubmitButton className="w-full" pendingText="جارٍ إرسال الطلب…">
        إرسال الطلب
      </SubmitButton>
    </form>
  );
}
