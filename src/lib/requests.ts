import "server-only";
import { supabase } from "./supabase";

export type BlogRequest = {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  experienceYears: number;
  sampleTitle: string;
  sampleContent: string;
  sampleCategory: string;
  motivation: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type Row = {
  id: number;
  full_name: string;
  email: string;
  specialty: string;
  experience_years: number;
  sample_title: string;
  sample_content: string;
  sample_category: string;
  motivation: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function toRequest(row: Row): BlogRequest {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    specialty: row.specialty,
    experienceYears: row.experience_years,
    sampleTitle: row.sample_title,
    sampleContent: row.sample_content,
    sampleCategory: row.sample_category,
    motivation: row.motivation,
    status: (["pending", "approved", "rejected"].includes(row.status)
      ? row.status
      : "pending") as BlogRequest["status"],
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export const REQUESTS_PAGE_SIZE = 12;

export async function getRequests(filters: {
  status?: string;
  category?: string;
  page: number;
}): Promise<{ items: BlogRequest[]; total: number }> {
  const from = (filters.page - 1) * REQUESTS_PAGE_SIZE;
  let query = supabase.from("blog_requests").select("*", { count: "exact" });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("sample_category", filters.category);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + REQUESTS_PAGE_SIZE - 1);

  if (error) throw new Error(`Failed to load blog requests: ${error.message}`);
  return { items: (data as Row[]).map(toRequest), total: count ?? 0 };
}

export async function getRequestStats(): Promise<Record<string, number>> {
  const { data } = await supabase.from("blog_requests").select("status");
  const stats: Record<string, number> = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const row of data ?? []) {
    stats.total += 1;
    stats[row.status] = (stats[row.status] ?? 0) + 1;
  }
  return stats;
}

export async function getRequest(id: string): Promise<BlogRequest | null> {
  if (!/^\d{1,12}$/.test(id)) return null;
  const { data } = await supabase.from("blog_requests").select("*").eq("id", Number(id)).maybeSingle();
  return data ? toRequest(data as Row) : null;
}

/** The latest invite code for an approved request, if any. */
export async function getInviteStatus(requestId: string) {
  const { data } = await supabase
    .from("invite_codes")
    .select("is_used, expires_at, used_at")
    .eq("blog_request_id", Number(requestId))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    isUsed: data.is_used as boolean,
    usedAt: data.used_at as string | null,
    expired: !data.is_used && new Date(data.expires_at) < new Date(),
    expiresAt: data.expires_at as string,
  };
}
