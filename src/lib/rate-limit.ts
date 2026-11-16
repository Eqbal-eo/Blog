import "server-only";
import { headers } from "next/headers";
import { supabase } from "./supabase";

/** Best-effort client IP (Vercel and most proxies set x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Counts one attempt for `key` and returns false once `max` attempts were
 * made within `windowSeconds`. Backed by the hit_rate_limit() function in
 * Postgres (supabase/migrations/20261117000000_rate_limits.sql).
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("hit_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });

  if (error) {
    // Fail open so a missing migration doesn't lock everyone out,
    // but make it loud.
    console.error("Rate limiter unavailable:", error.message);
    return true;
  }
  return data === true;
}
