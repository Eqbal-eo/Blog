import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export type Session = {
  id: string;
  username: string;
};

// Kept from the legacy app so existing sessions survive the switch.
const COOKIE_NAME = "auth_token";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be set");
  return new TextEncoder().encode(secret);
}

/** The signed-in user's id from the session cookie, or null. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.id === undefined || typeof payload.username !== "string") {
      return null;
    }
    return { id: String(payload.id), username: payload.username };
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; username: string }) {
  const token = await new SignJWT({ id: Number(user.id), username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" so links from emails (e.g. to /login) still carry the cookie
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
