"use client";

import { useActionState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { savePost } from "./actions";
import { initialFormState } from "@/lib/forms";
import { POST_CATEGORIES } from "@/lib/format";
import { FormMessage, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { button } from "@/components/ui/styles";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { WritingAssistant } from "@/components/editor/writing-assistant";

export function PostForm({
  post,
  isAdmin,
  assistant,
  demo = false,
}: {
  post?: {
    id: string;
    title: string;
    category: string | null;
    html: string;
    status: string;
    rejectionReason: string | null;
    summary: string | null;
  };
  isAdmin: boolean;
  /** Whether the AI writing assistant is configured on the server. */
  assistant: boolean;
  /** Public demo account: drafts only. */
  demo?: boolean;
}) {
  const editorRef = useRef<Editor | null>(null);
  const [state, action] = useActionState(savePost.bind(null, post?.id ?? null), initialFormState);
  const contentError = state.fieldErrors?.content;

  const submitLabel = isAdmin || post?.status === "published"
    ? post ? "حفظ ونشر" : "نشر التدوينة"
    : post?.status === "rejected" ? "إعادة الإرسال للمراجعة" : "إرسال للمراجعة";

  return (
    <form action={action} className="space-y-6" noValidate>
      {post?.status === "rejected" && post.rejectionReason && (
        <div role="note" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-bold">رُفضت هذه التدوينة للسبب التالي:</p>
          <p className="mt-1 whitespace-pre-line">{post.rejectionReason}</p>
          <p className="mt-2 text-sm">عدّلها ثم أعد إرسالها للمراجعة.</p>
        </div>
      )}

      <FormMessage state={state} />

      <TextField
        name="title"
        label="عنوان التدوينة"
        state={state}
        defaultValue={post?.title}
        className="block w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-xl font-bold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 aria-invalid:border-red-600"
        required
      />

      <SelectField
        name="category"
        label="التصنيف"
        state={state}
        defaultValue={post?.category ?? ""}
        options={POST_CATEGORIES}
        placeholder="اختر التصنيف"
        required
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium">المحتوى</span>
        <RichTextEditor
          // Remount after a failed submit so the editor shows what was sent
          key={state.values?.content ?? "initial"}
          name="content"
          initialHtml={state.values?.content ?? post?.html ?? ""}
          invalid={Boolean(contentError)}
          describedBy={contentError ? "content-error" : undefined}
          onReady={(editor) => {
            editorRef.current = editor;
          }}
        />
        {contentError && (
          <p id="content-error" className="mt-1.5 text-sm text-red-700">
            {contentError}
          </p>
        )}
      </div>

      {assistant && (
        <WritingAssistant
          getEditor={() => editorRef.current}
          titleInputId="title"
          summaryInputId="summary"
        />
      )}

      <TextAreaField
        name="summary"
        label="وصف قصير (اختياري)"
        hint="جملة تلخّص التدوينة، تظهر في نتائج البحث وعند مشاركة الرابط. إن تركتها فارغة نستخدم بداية النص."
        rows={2}
        maxLength={300}
        state={state}
        defaultValue={post?.summary ?? ""}
      />

      {demo && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          أنت في الحساب التجريبي: تُحفظ التدوينات كمسودات فقط، وتُحذف يومياً.
        </p>
      )}

      {!demo && !isAdmin && post?.status !== "published" && (
        <p className="text-sm text-muted">
          تظهر التدوينات للقرّاء بعد موافقة المشرف عليها.
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        {!demo && (
          <SubmitButton name="intent" value="submit" pendingText="جارٍ الحفظ…">
            {submitLabel}
          </SubmitButton>
        )}
        <SubmitButton name="intent" value="draft" variant="outline" pendingText="جارٍ الحفظ…">
          {post?.status === "published" ? "إلغاء النشر وحفظ كمسودة" : "حفظ كمسودة"}
        </SubmitButton>
        <Link href="/dashboard/posts" className={`${button.ghost} ms-auto`}>
          إلغاء
        </Link>
      </div>
    </form>
  );
}
