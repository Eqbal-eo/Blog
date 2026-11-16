import "server-only";
import { randomBytes } from "node:crypto";
import { supabase } from "./supabase";
import { excerpt } from "./sanitize";
import { sendNewPostEmail, sendSubscriptionConfirmation } from "./email";

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Starts a subscription (double opt-in): stores it unconfirmed and emails a
 * confirmation link. Re-subscribing re-sends the link. `authorId` null means
 * every new post on the site. `email` must already be lowercased.
 */
export async function subscribe(email: string, author: { id: string; name: string } | null) {
  const authorId = author ? Number(author.id) : null;

  let query = supabase.from("subscribers").select("id, token, confirmed_at").eq("email", email);
  query = authorId === null ? query.is("author_id", null) : query.eq("author_id", authorId);
  const { data: existing, error: lookupError } = await query.maybeSingle();
  if (lookupError) throw new Error(lookupError.message);

  if (existing?.confirmed_at) return { alreadyConfirmed: true };

  let token = existing?.token as string | undefined;
  if (!existing) {
    token = newToken();
    const { error } = await supabase
      .from("subscribers")
      .insert([{ email, author_id: authorId, token }]);
    if (error) throw new Error(error.message);
  }

  await sendSubscriptionConfirmation(email, {
    token: token!,
    scope: author ? `التدوينات الجديدة من ${author.name}` : "كل التدوينات الجديدة في مدونات آفاق",
  });
  return { alreadyConfirmed: false };
}

/**
 * Emails a newly published post to confirmed subscribers of its writer and
 * of the whole site (each address once). Call it inside after().
 */
export async function notifySubscribers(postId: string) {
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, user_id, status, users ( username, display_name_ar )")
    .eq("id", Number(postId))
    .maybeSingle();
  if (!post || post.status !== "published") return;

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, token, author_id")
    .not("confirmed_at", "is", null)
    .or(`author_id.is.null,author_id.eq.${post.user_id}`);

  if (error) {
    // 42P01 = table missing (migration not run yet)
    if (error.code !== "42P01") console.error("Subscribers not loaded:", error.message);
    return;
  }

  const user = Array.isArray(post.users) ? post.users[0] : post.users;
  const authorName = user?.display_name_ar || user?.username || "كاتب";
  const summary = excerpt(post.content, 220);

  // One email per address; prefer the writer-specific token for unsubscribe
  const byEmail = new Map<string, { email: string; token: string }>();
  for (const s of subscribers ?? []) {
    const key = s.email.toLowerCase();
    if (!byEmail.has(key) || s.author_id !== null) byEmail.set(key, { email: s.email, token: s.token });
  }

  for (const { email, token } of byEmail.values()) {
    await sendNewPostEmail(email, {
      postId: String(post.id),
      title: post.title,
      authorName,
      excerpt: summary,
      token,
    });
  }
}
