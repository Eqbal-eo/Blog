import type { z } from "zod";

/** State returned by Server Actions used with useActionState. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values, to refill the form after React resets it. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Plain string values of a form submission (files are ignored). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) {
      values[key] = value;
    }
  }
  return values;
}

/** First error message per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function errorState(
  message: string,
  values?: Record<string, string>,
  errors?: Record<string, string>,
): FormState {
  return { status: "error", message, values, fieldErrors: errors };
}
