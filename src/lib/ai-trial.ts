// Shared by the browser and the server, so no server-only imports here.
// The assistant is a trial for now: few requests, so that its cost stays small.

/** Requests one writer may make in 24 hours, both tools together. */
export const TRIAL_PER_WRITER = 3;

/** Requests the whole site may make in 24 hours. */
export const TRIAL_PER_SITE = 10;
