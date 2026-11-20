import { connection } from "next/server";
import { resetDemoAccount } from "@/lib/demo-seed";

/**
 * Daily reset of the public demo account (scheduled in vercel.json).
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; anything else is
 * rejected, so the endpoint can't be triggered by visitors.
 */
export async function GET(request: Request) {
  await connection();

  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const reset = await resetDemoAccount();
  return Response.json({ ok: true, reset });
}
