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

/** Estimated reading time in minutes (about 200 Arabic words a minute). */
export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(wordCount(html.replace(/data:[^"' ]+/g, " ")) / 200));
}

/** e.g. "٥ دقائق قراءة" */
export function readingTimeLabel(minutes: number): string {
  if (minutes === 1) return "دقيقة قراءة";
  if (minutes === 2) return "دقيقتا قراءة";
  if (minutes <= 10) return `${formatNumber(minutes)} دقائق قراءة`;
  return `${formatNumber(minutes)} دقيقة قراءة`;
}

/** e.g. "١٢٣ مشاهدة" */
export function viewsLabel(count: number): string {
  if (count === 1) return "مشاهدة واحدة";
  if (count === 2) return "مشاهدتان";
  if (count <= 10) return `${formatNumber(count)} مشاهدات`;
  return `${formatNumber(count)} مشاهدة`;
}

export function isPostCategory(value: string): boolean {
  return POST_CATEGORIES.some(([code]) => code === value);
}
