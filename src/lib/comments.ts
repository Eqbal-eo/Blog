import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";

export type Comment = {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type Row = {
  id: number;
  post_id: number;
  author_name: string;
  body: string;
  status: string;
  created_at: string;
};

function toComment(row: Row): Comment {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    authorName: row.author_name,
    body: row.body,
    status: row.status as Comment["status"],
    createdAt: row.created_at,
  };
}

/** Approved comments on a post, oldest first. Empty if comments aren't set up. */
export async function getApprovedComments(postId: string): Promise<Comment[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`comments-${postId}`);

  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_name, body, status, created_at")
    .eq("post_id", Number(postId))
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    if (error.code !== "42P01") console.error("Failed to load comments:", error.message);
    return [];
  }
  return (data as Row[]).map(toComment);
}

export type PendingComment = Comment & { postTitle: string; authorEmail: string | null };

/** Comments awaiting moderation, oldest first. */
export async function getPendingComments(): Promise<PendingComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_name, author_email, body, status, created_at, posts ( title )")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    if (error.code !== "42P01") console.error("Failed to load pending comments:", error.message);
    return [];
  }

  return (data as unknown as (Row & { author_email: string | null; posts: { title: string } | { title: string }[] | null })[]).map(
    (row) => {
      const post = Array.isArray(row.posts) ? row.posts[0] : row.posts;
      return { ...toComment(row), postTitle: post?.title ?? "تدوينة محذوفة", authorEmail: row.author_email };
    },
  );
}

export async function countPendingComments(): Promise<number> {
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return error ? 0 : (count ?? 0);
}
