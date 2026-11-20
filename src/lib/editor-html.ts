/**
 * Prepares stored HTML for the Tiptap editor. Posts written with Quill keep
 * alignment in classes (ql-align-center); Tiptap reads it from the style
 * attribute instead, so convert it rather than lose it on the next save.
 */
export function toEditorHtml(html: string): string {
  return html.replace(
    /<(p|h[1-6]|li|blockquote)([^>]*?)\sclass="([^"]*?)ql-align-(center|right|left|justify)([^"]*)"/g,
    (_m, tag: string, before: string, pre: string, align: string, post: string) => {
      const rest = `${pre}${post}`.trim();
      return `<${tag}${before} style="text-align: ${align}"${rest ? ` class="${rest}"` : ""}`;
    },
  );
}
