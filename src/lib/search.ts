/**
 * Same rules as public.normalize_ar() in Postgres
 * (supabase/migrations/20261118000000_reader_features.sql): strip diacritics
 * and tatweel, unify alef / yaa / taa marbuta forms. Keep the two in sync.
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
