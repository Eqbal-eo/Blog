import "server-only";
import sanitizeHtml from "sanitize-html";

const COLOR = [
  /^#(0x)?[0-9a-f]+$/i,
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)$/i,
  /^[a-z]+$/i,
];

// Allowlist covering what the Tiptap editor produces, plus the markup of
// older posts written with Quill (ql-* classes, inline colors).
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
    "ol", "ul", "li", "a", "img", "blockquote", "pre", "code", "span",
  ],
  allowedAttributes: {
    "*": ["class", "dir", "style"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedClasses: { "*": ["ql-*"] },
  allowedStyles: {
    "*": {
      color: COLOR,
      "background-color": COLOR,
      "text-align": [/^(left|right|center|justify)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
    }),
  },
};

/** Strip scripts, event handlers and unsafe URLs from user-authored HTML. */
export function sanitize(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}

/** Plain-text excerpt of an HTML document. */
export function excerpt(html: string | null | undefined, length = 160): string {
  if (!html) return "";
  // Keep a space where a block ended so "heading" and "paragraph" don't fuse
  const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote|pre|div)>|<br\s*\/?>/gi, "$& ");
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}
