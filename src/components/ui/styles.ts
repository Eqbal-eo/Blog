// Shared Tailwind class strings, usable from Server and Client Components.

export const button = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-ink/80 px-5 py-2.5 text-sm font-medium transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-brand-soft hover:text-brand disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60",
  dangerOutline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-red-700 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-700 hover:text-white disabled:opacity-60",
};

export const input =
  "block w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 aria-invalid:border-red-600";

export const label = "mb-1.5 block text-sm font-medium";

export const card = "rounded-2xl border border-line bg-surface";

export const badge =
  "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium";

export const statusBadge: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-800",
  approved: "bg-emerald-50 text-emerald-800",
  pending: "bg-amber-50 text-amber-800",
  draft: "bg-stone-100 text-stone-700",
  rejected: "bg-red-50 text-red-800",
};
