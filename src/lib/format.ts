const dateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-arab", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-arab", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Riyadh",
});

const numberFormatter = new Intl.NumberFormat("ar-EG-u-nu-arab");

/** e.g. ١٤ نوفمبر ٢٠٢٦ */
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

/** e.g. ١٤ نوفمبر ٢٠٢٦، ٣:٠٥ م */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormatter.format(date);
}

/** e.g. ١٢ */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Category codes stored on posts and blog requests, with their Arabic labels.
 * The first six are the post categories; the rest are only offered on the
 * blog request form, as in the legacy app.
 */
export const POST_CATEGORIES = [
  ["politics", "سياسة"],
  ["history", "تاريخ"],
  ["economics", "اقتصاد"],
  ["technology", "تكنولوجيا"],
  ["literature", "أدب"],
  ["medicine", "طب"],
] as const;

export const REQUEST_CATEGORIES = [
  ...POST_CATEGORIES,
  ["culture", "ثقافة"],
  ["philosophy", "فلسفة"],
  ["religion", "دين"],
  ["art", "فن"],
  ["science", "علوم"],
  ["other", "أخرى"],
] as const;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(REQUEST_CATEGORIES);

/** Arabic label for a category code, falling back to the stored value. */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export const POST_STATUS_LABELS: Record<string, string> = {
  published: "منشورة",
  pending: "قيد المراجعة",
  draft: "مسودة",
  rejected: "مرفوضة",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

/** Arabic plural for "تدوينة". */
export function postsCount(count: number): string {
  if (count === 0) return "لا تدوينات بعد";
  if (count === 1) return "تدوينة واحدة";
  if (count === 2) return "تدوينتان";
  if (count <= 10) return `${formatNumber(count)} تدوينات`;
  return `${formatNumber(count)} تدوينة`;
}

/** Words in a plain-text or HTML string. */
export function wordCount(text: string): number {
  const plain = text.replace(/<[^>]*>/g, " ").trim();
  return plain ? plain.split(/\s+/).length : 0;
}
