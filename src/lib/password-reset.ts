import "server-only";
import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { supabase } from "./supabase";
import { DEMO_USERNAME } from "./demo";

/*
 * Password reset links carry a signed token (no database table needed):
 * - valid for one hour;
 * - bound to a fingerprint of the current password hash, so it stops
 *   working as soon as the password changes (single use in practice).
 */

const TTL = "1h";
const AUDIENCE = "password-reset";

function key(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be set");
  return new TextEncoder().encode(secret);
}

function fingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 22);
}

export async function createResetToken(userId: string, passwordHash: string): Promise<string> {
  return new SignJWT({ pwh: fingerprint(passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(key());
}

/** The user id the token is for, or null if invalid, expired or already used. */
export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: AUDIENCE });
    if (!payload.sub || typeof payload.pwh !== "string") return null;

    const { data: user } = await supabase
      .from("users")
      .select("id, password")
      .eq("id", Number(payload.sub))
      .maybeSingle();
    if (!user || fingerprint(user.password) !== payload.pwh) return null;
    return String(user.id);
  } catch {
    return null;
  }
}

/**
 * Finds the account for an email address: the blog contact email in
 * settings, or the email the writer registered with (invite code).
 */
export async function findAccountByEmail(email: string) {
  // Case-insensitive exact match: escape LIKE wildcards so "a_b@x.com"
  // can't match "axb@x.com" and send someone else's reset link
  // (PostgREST also reads "*" as a wildcard; no real address needs it)
  if (email.includes("*")) return null;
  const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const [settings, invite] = await Promise.all([
    supabase.from("settings").select("user_id").ilike("email", pattern).limit(1),
    supabase.from("invite_codes").select("used_by").ilike("email", pattern).not("used_by", "is", null).limit(1),
  ]);
  const userId = settings.data?.[0]?.user_id ?? invite.data?.[0]?.used_by;
  if (!userId) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id, username, display_name_ar, password")
    .eq("id", userId)
    .maybeSingle();
  if (!user || user.username === DEMO_USERNAME) return null;
  return user as { id: number; username: string; display_name_ar: string | null; password: string };
}
