import "server-only";
import { supabase } from "./supabase";
import { excerpt } from "./sanitize";

/** A post as its author (or an admin) sees it, whatever its status. */
export type OwnPost = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string | null;
  status: "published" | "pending" | "draft" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  publishedAt: string | null;
  viewCount: number;
  userId: string;
};

type Row = {
  id: number;
  title: string;
  content: string | null;
  category: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
  view_count?: number | null;
  user_id: number;
};

const COLUMNS =
  "id, title, content, category, status, rejection_reason, created_at, updated_at, published_at, user_id";

const STATUSES = ["published", "pending", "draft", "rejected"] as const;

function toPost(row: Row): OwnPost {
  return {
    id: String(row.id),
    title: row.title,
    content: row.content ?? "",
    excerpt: excerpt(row.content, 140),
    category: row.category,
    status: (STATUSES as readonly string[]).includes(row.status)
      ? (row.status as OwnPost["status"])
      : "draft",
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    viewCount: row.view_count ?? 0,
    userId: String(row.user_id),
  };
}

/** Accepts only numeric ids, so bad input is a 404 rather than a DB error. */
export function parsePostId(id: string): number | null {
  return /^\d{1,12}$/.test(id) ? Number(id) : null;
}

export async function getUserPosts(userId: string): Promise<OwnPost[]> {
  const [{ data, error }, views] = await Promise.all([
    supabase.from("posts").select(COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }),
    // view_count comes from the reader features migration; ignore it if missing
    supabase.from("posts").select("id, view_count").eq("user_id", userId),
  ]);
  if (error) throw new Error(`Failed to load posts: ${error.message}`);

  const counts = new Map((views.data ?? []).map((v) => [v.id as number, (v.view_count as number) ?? 0]));
  return (data as Row[]).map((row) => ({ ...toPost(row), viewCount: counts.get(row.id) ?? 0 }));
}

/** One of the user's own posts, or null. */
export async function getUserPost(userId: string, id: string): Promise<OwnPost | null> {
  const postId = parsePostId(id);
  if (postId === null) return null;
  const { data } = await supabase
    .from("posts")
    .select(COLUMNS)
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ? toPost(data as Row) : null;
}

export type PendingPost = OwnPost & { authorName: string };

type UserRef = { username: string; display_name_ar: string | null };
type RowWithUser = Row & { users: UserRef | UserRef[] | null };

function withAuthor(row: RowWithUser): PendingPost {
  const user = Array.isArray(row.users) ? row.users[0] : row.users;
  return {
    ...toPost(row),
    authorName: user?.display_name_ar || user?.username || "كاتب مجهول",
  };
}

/** Posts awaiting review, oldest first so nobody waits forever. */
export async function getPendingPosts(): Promise<PendingPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`${COLUMNS}, users ( username, display_name_ar )`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load pending posts: ${error.message}`);

  return (data as unknown as RowWithUser[]).map(withAuthor);
}

/** Any post by id, for admin review. */
export async function getPostForReview(id: string): Promise<PendingPost | null> {
  const postId = parsePostId(id);
  if (postId === null) return null;
  const { data } = await supabase
    .from("posts")
    .select(`${COLUMNS}, users ( username, display_name_ar )`)
    .eq("id", postId)
    .maybeSingle();
  return data ? withAuthor(data as unknown as RowWithUser) : null;
}

export { toEditorHtml } from "./editor-html";

/** A post's summary; null if empty or the column doesn't exist yet. */
export async function getPostSummary(id: string): Promise<string | null> {
  const postId = parsePostId(id);
  if (postId === null) return null;
  const { data, error } = await supabase.from("posts").select("summary").eq("id", postId).maybeSingle();
  return error ? null : ((data?.summary as string | null) ?? null);
}
