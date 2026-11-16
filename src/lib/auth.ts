import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { supabase } from "./supabase";
import { getSession } from "./session";

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  displayNameAr: string | null;
  bio: string | null;
  role: "admin" | "user";
};

/**
 * The signed-in user, loaded fresh from the database once per request.
 * The role comes from the database, not the cookie, so revoking admin
 * rights or deleting an account takes effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("users")
    .select("id, username, display_name_ar, bio, role")
    .eq("id", session.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: String(data.id),
    username: data.username,
    displayName: data.display_name_ar || data.username,
    displayNameAr: data.display_name_ar,
    bio: data.bio,
    role: data.role === "admin" ? "admin" : "user",
  };
});

/** For pages and actions that need a signed-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For admin pages and actions. Non-admins get a 404, not a hint. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return user;
}
