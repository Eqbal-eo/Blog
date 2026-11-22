/*
 * Public demo account: visitors can sign in with published credentials to
 * try the writer dashboard. It can write drafts and try the writing
 * assistant, but cannot publish, upload files, change its credentials or
 * delete itself, and its data is reset daily (/api/cron/reset-demo).
 *
 * It exists only where DEMO_PASSWORD is set. Without it the account can
 * neither sign in nor use a session issued earlier.
 */

export const DEMO_USERNAME = "demo";

export function isDemoUser(user: { username: string } | null | undefined): boolean {
  return user?.username === DEMO_USERNAME;
}

/** True for the demo account on a site where it isn't enabled. */
export function isClosedDemoAccount(user: { username: string } | null | undefined): boolean {
  return isDemoUser(user) && !process.env.DEMO_PASSWORD;
}

export const DEMO_BLOCKED_MESSAGE = "هذا الإجراء غير متاح في الحساب التجريبي.";
