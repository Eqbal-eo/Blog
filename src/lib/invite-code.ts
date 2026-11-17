import "server-only";
import { randomBytes } from "node:crypto";

/** Code for a newly approved blog request: 8 characters, no look-alikes. */
export function generateInviteCode(): string {
  // 32 symbols, so `byte % 32` has no modulo bias
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
}
