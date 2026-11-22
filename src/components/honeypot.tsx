import { HONEYPOT_FIELD } from "@/lib/honeypot";

/** The bot trap, hidden from people and marked for password managers to skip. */
export function Honeypot() {
  return (
    <input
      name={HONEYPOT_FIELD}
      tabIndex={-1}
      autoComplete="off"
      data-1p-ignore=""
      data-bwignore=""
      data-lpignore="true"
      data-form-type="other"
      className="hidden"
      aria-hidden
    />
  );
}
