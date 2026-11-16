import type { ReactNode } from "react";

/** Centered card used by the login, registration and request pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto px-4 py-12 sm:py-16 ${wide ? "max-w-2xl" : "max-w-md"}`}>
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 space-y-1 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
