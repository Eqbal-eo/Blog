// Shared by the browser and the server, so no server-only imports here.

/**
 * A hidden field that naive bots fill in. Its name must mean nothing to
 * autofill: when it was called "website", browsers filled it in for real people.
 */
export const HONEYPOT_FIELD = "hp_check";

/** Never a fake success: a person caught by mistake has to know nothing was sent. */
export const HONEYPOT_MESSAGE =
  "لم يُرسل النموذج. أعد المحاولة، واكتب بياناتك بنفسك دون تعبئة تلقائية.";

export function honeypotFilled(formData: FormData): boolean {
  return Boolean(formData.get(HONEYPOT_FIELD));
}
