import "server-only";
import { supabase } from "./supabase";

export type NotificationType = "post_approved" | "post_rejected";

export type Notification = {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  postId: string | null;
};

export async function createNotification(
  userId: string,
  postId: string,
  message: string,
  type: NotificationType,
) {
  const { error } = await supabase
    .from("notifications")
    .insert([{ user_id: userId, post_id: postId, message, type }]);
  if (error) console.error("Failed to create notification:", error.message);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function getNotifications(
  userId: string,
  { limit, offset = 0 }: { limit: number; offset?: number },
): Promise<{ items: Notification[]; total: number }> {
  const { data, count, error } = await supabase
    .from("notifications")
    .select("id, message, type, is_read, created_at, post_id", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to load notifications: ${error.message}`);

  return {
    total: count ?? 0,
    items: (data ?? []).map((row) => ({
      id: String(row.id),
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at,
      postId: row.post_id === null ? null : String(row.post_id),
    })),
  };
}
