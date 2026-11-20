"use client";

import { useState, useTransition } from "react";
import type { Editor } from "@tiptap/react";
import { Check, Loader2, SpellCheck, Sparkles, X } from "lucide-react";
import { proofreadDraft, suggestTitleAndSummary } from "@/app/dashboard/ai-actions";
import type { Correction, MetaSuggestions } from "@/lib/ai";
import { button } from "@/components/ui/styles";

type Item = Correction & { state: "open" | "applied" | "ignored" | "missing" };

/** Finds `text` inside a single text node of the document. */
function findText(editor: Editor, text: string): { from: number; to: number } | null {
  let found: { from: number; to: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.isText && node.text) {
      const index = node.text.indexOf(text);
      if (index !== -1) found = { from: pos + index, to: pos + index + text.length };
    }
    return !found;
  });
  return found;
}

/** Replaces the first occurrence of `original`, keeping its formatting. */
function replaceText(editor: Editor, original: string, replacement: string): boolean {
  const range = findText(editor, original);
  if (!range) return false;
  editor.view.dispatch(editor.state.tr.insertText(replacement, range.from, range.to));
  return true;
}

function setInputValue(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) return;
  el.value = value;
  el.focus();
}

/**
 * Writing assistant shown under the editor: Arabic proofreading and title /
 * summary ideas. Suggestions only; nothing changes until the author applies it.
 */
export function WritingAssistant({
  getEditor,
  titleInputId,
  summaryInputId,
}: {
  getEditor: () => Editor | null;
  titleInputId: string;
  summaryInputId: string;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [meta, setMeta] = useState<MetaSuggestions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"proofread" | "meta" | null>(null);
  const [, startTransition] = useTransition();

  const draftText = () => getEditor()?.getText({ blockSeparator: "\n\n" }).trim() ?? "";

  const runProofread = () => {
    setError(null);
    setBusy("proofread");
    startTransition(async () => {
      const result = await proofreadDraft(draftText());
      setBusy(null);
      if (!result.ok) return setError(result.message);
      setItems(result.data.map((c) => ({ ...c, state: "open" })));
    });
  };

  const runMeta = () => {
    setError(null);
    setBusy("meta");
    const title = (document.getElementById(titleInputId) as HTMLInputElement | null)?.value ?? "";
    startTransition(async () => {
      const result = await suggestTitleAndSummary(title, draftText());
      setBusy(null);
      if (!result.ok) return setError(result.message);
      setMeta(result.data);
    });
  };

  const apply = (index: number) => {
    const editor = getEditor();
    if (!editor || !items) return;
    const item = items[index];
    const ok = replaceText(editor, item.original, item.suggestion);
    setItems(items.map((it, i) => (i === index ? { ...it, state: ok ? "applied" : "missing" } : it)));
  };

  const applyAll = () => {
    const editor = getEditor();
    if (!editor || !items) return;
    setItems(
      items.map((it) =>
        it.state !== "open" ? it : { ...it, state: replaceText(editor, it.original, it.suggestion) ? "applied" : "missing" },
      ),
    );
  };

  const ignore = (index: number) =>
    setItems((prev) => prev?.map((it, i) => (i === index ? { ...it, state: "ignored" } : it)) ?? null);

  const open = items?.filter((i) => i.state === "open").length ?? 0;

  return (
    <section aria-label="مساعد الكتابة" className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="me-auto flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-brand" aria-hidden />
          مساعد الكتابة
        </span>
        <button type="button" onClick={runProofread} disabled={busy !== null} className={`${button.outline} py-1.5`}>
          {busy === "proofread" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <SpellCheck className="size-4" aria-hidden />}
          تدقيق لغوي
        </button>
        <button type="button" onClick={runMeta} disabled={busy !== null} className={`${button.outline} py-1.5`}>
          {busy === "meta" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          اقتراح عنوان ووصف
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        اقتراحات فقط: لا يتغير شيء في نصك حتى تضغط «تطبيق». يُرسل النص إلى خدمة ذكاء اصطناعي عند الضغط على أحد الزرين.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {items && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold">
              {items.length === 0 ? "لم يجد المدقق أخطاء واضحة." : `التصحيحات المقترحة (${items.length})`}
            </h3>
            {open > 1 && (
              <button type="button" onClick={applyAll} className={`${button.ghost} py-1 text-xs`}>
                تطبيق الكل
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line px-3 py-2 text-sm ${
                  item.state === "open" ? "" : "opacity-60"
                }`}
              >
                <span>
                  <del className="text-red-700">{item.original}</del>
                  <span className="mx-1.5 text-muted">←</span>
                  <ins className="font-medium text-emerald-700 no-underline">{item.suggestion}</ins>
                </span>
                <span className="text-xs text-muted">{item.reason}</span>
                <span className="ms-auto flex gap-1">
                  {item.state === "open" ? (
                    <>
                      <button type="button" onClick={() => apply(index)} className={`${button.ghost} py-1`} aria-label={`تطبيق: ${item.suggestion}`}>
                        <Check className="size-4" aria-hidden />
                        تطبيق
                      </button>
                      <button type="button" onClick={() => ignore(index)} className={`${button.ghost} py-1`} aria-label="تجاهل">
                        <X className="size-4" aria-hidden />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted">
                      {item.state === "applied" ? "طُبّق" : item.state === "ignored" ? "تم التجاهل" : "لم يُعثر عليه (ربما عُدّل)"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <h3 className="text-sm font-bold">عناوين مقترحة</h3>
          <ul className="space-y-2">
            {meta.titles.map((title) => (
              <li key={title} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="flex-1 font-medium">{title}</span>
                <button type="button" onClick={() => setInputValue(titleInputId, title)} className={`${button.ghost} py-1`}>
                  استخدام
                </button>
              </li>
            ))}
          </ul>
          {meta.description && (
            <>
              <h3 className="text-sm font-bold">وصف مقترح</h3>
              <div className="flex items-start gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                <p className="flex-1 leading-relaxed">{meta.description}</p>
                <button type="button" onClick={() => setInputValue(summaryInputId, meta.description)} className={`${button.ghost} py-1`}>
                  استخدام
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
