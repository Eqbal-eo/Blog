"use client";

import { useEditor, EditorContent, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

/**
 * Rich text editor for posts. Stores HTML in a hidden input named `name`,
 * so it works inside a regular <form> with a Server Action.
 */
export function RichTextEditor({
  name,
  initialHtml,
  invalid,
  describedBy,
}: {
  name: string;
  initialHtml: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [html, setHtml] = useState(initialHtml);

  const editor = useEditor({
    // Rendered on the client only; avoids a hydration mismatch
    immediatelyRender: false,
    textDirection: "rtl",
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["right", "center", "left", "justify"],
      }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: "اكتب محتوى التدوينة هنا…" }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "article-body min-h-96 px-5 py-4 focus:outline-none",
        "aria-label": "محتوى التدوينة",
        ...(invalid && { "aria-invalid": "true" }),
        ...(describedBy && { "aria-describedby": describedBy }),
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-surface focus-within:ring-2 focus-within:ring-brand/20 ${
        invalid ? "border-red-600" : "border-line focus-within:border-brand"
      }`}
    >
      <input type="hidden" name={name} value={html} />
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-line bg-paper" />}
      <EditorContent editor={editor} />
    </div>
  );
}

type ToolbarItem = {
  icon: LucideIcon;
  label: string;
  isActive?: (e: Editor) => boolean;
  run: (e: Editor) => void;
  canRun?: (e: Editor) => boolean;
};

function promptLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("أدخل الرابط (اتركه فارغاً لإزالته):", previous ?? "https://");
  if (url === null) return;
  if (url.trim() === "" || url.trim() === "https://") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  } else {
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }
}

function promptImage(editor: Editor) {
  const url = window.prompt("أدخل رابط الصورة:", "https://");
  if (url && /^https?:\/\//.test(url.trim())) {
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }
}

const GROUPS: ToolbarItem[][] = [
  [
    { icon: Heading2, label: "عنوان رئيسي", isActive: (e) => e.isActive("heading", { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, label: "عنوان فرعي", isActive: (e) => e.isActive("heading", { level: 3 }), run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  ],
  [
    { icon: Bold, label: "غامق", isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
    { icon: Italic, label: "مائل", isActive: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
    { icon: Underline, label: "تسطير", isActive: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
    { icon: Strikethrough, label: "يتوسطه خط", isActive: (e) => e.isActive("strike"), run: (e) => e.chain().focus().toggleStrike().run() },
  ],
  [
    { icon: List, label: "قائمة نقطية", isActive: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, label: "قائمة مرقمة", isActive: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
    { icon: Quote, label: "اقتباس", isActive: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
    { icon: Code2, label: "كتلة شيفرة", isActive: (e) => e.isActive("codeBlock"), run: (e) => e.chain().focus().toggleCodeBlock().run() },
  ],
  [
    { icon: AlignRight, label: "محاذاة لليمين", isActive: (e) => e.isActive({ textAlign: "right" }), run: (e) => e.chain().focus().setTextAlign("right").run() },
    { icon: AlignCenter, label: "توسيط", isActive: (e) => e.isActive({ textAlign: "center" }), run: (e) => e.chain().focus().setTextAlign("center").run() },
    { icon: AlignLeft, label: "محاذاة لليسار", isActive: (e) => e.isActive({ textAlign: "left" }), run: (e) => e.chain().focus().setTextAlign("left").run() },
    { icon: AlignJustify, label: "ضبط", isActive: (e) => e.isActive({ textAlign: "justify" }), run: (e) => e.chain().focus().setTextAlign("justify").run() },
  ],
  [
    { icon: Link2, label: "رابط", isActive: (e) => e.isActive("link"), run: promptLink },
    { icon: ImageIcon, label: "صورة من رابط", run: promptImage },
  ],
  [
    { icon: Undo2, label: "تراجع", run: (e) => e.chain().focus().undo().run(), canRun: (e) => e.can().undo() },
    { icon: Redo2, label: "إعادة", run: (e) => e.chain().focus().redo().run(), canRun: (e) => e.can().redo() },
  ],
];

const ALL_ITEMS = GROUPS.flat();

function Toolbar({ editor }: { editor: Editor }) {
  // Re-render the toolbar only when the active/enabled states change
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      ALL_ITEMS.map((item) => ({
        active: item.isActive?.(e) ?? false,
        enabled: item.canRun?.(e) ?? true,
      })),
  });

  let index = 0;
  return (
    <div
      role="toolbar"
      aria-label="أدوات التنسيق"
      className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-b border-line bg-paper/95 px-2 py-1.5 backdrop-blur"
    >
      {GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5 border-line not-last:border-e not-last:pe-1">
          {group.map((item) => {
            const { active, enabled } = state[index++];
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={item.isActive ? active : undefined}
                disabled={!enabled}
                onClick={() => item.run(editor)}
                className={`rounded-md p-2 transition disabled:opacity-30 ${
                  active ? "bg-brand text-white" : "text-ink/75 hover:bg-brand-soft hover:text-brand"
                }`}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
