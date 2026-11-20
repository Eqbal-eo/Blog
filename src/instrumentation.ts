import * as Sentry from "@sentry/nextjs";

/*
 * Server-side error monitoring with Sentry. Does nothing until SENTRY_DSN is
 * set, so the site runs the same with or without a Sentry project.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  // Same options for the Node.js and Edge runtimes
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Reports errors thrown while rendering pages and running Server Actions
export const onRequestError = Sentry.captureRequestError;
