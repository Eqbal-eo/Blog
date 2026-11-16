import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { clientIp } from "./rate-limit";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|lighthouse|headless/i;

/**
 * An anonymous, non-reversible visitor key (salted hash of IP and browser),
 * used to de-duplicate views and throttle comments. No IP is ever stored.
 */
export async function visitorKey(): Promise<string> {
  const h = await headers();
  const ip = await clientIp();
  const ua = h.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${process.env.JWT_SECRET ?? ""}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32);
}

export async function isBot(): Promise<boolean> {
  const ua = (await headers()).get("user-agent") ?? "";
  return ua === "" || BOT.test(ua);
}
