/** Decorative: a pen writing in an open book while the sun rises on the horizon (آفاق). */
export function LoginIllustration() {
  return (
    <div aria-hidden className="text-center">
      <svg viewBox="0 0 520 420" className="mx-auto w-full max-w-lg" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Sunrise */}
        <path d="M60 244a200 200 0 0 1 400 0Z" className="fill-brand-soft" />
        <path d="M172 244a88 88 0 0 1 176 0Z" className="fill-brand/25" />
        <path
          d="M260 132v-30M204 147l-15-26M316 147l15-26M163 188l-26-15M357 188l26-15"
          className="stroke-brand/40"
          strokeWidth="5"
        />
        <path d="M24 244h472" className="stroke-brand/50" strokeWidth="3" />

        {/* Open book */}
        <path d="M50 266 38 378q120-22 222 14 102-36 222-14l-12-112Z" className="fill-brand" />
        <path d="M260 270q-86-38-200-18L50 364q114-18 210 16Z" className="fill-surface stroke-line" strokeWidth="2" />
        <path d="M260 270q86-38 200-18l10 112q-114-18-210 16Z" className="fill-surface stroke-line" strokeWidth="2" />

        {/* Lines run right to left: the right page is full, the left one is being written */}
        <path
          d="M435 280q-74-9-148 15M438 304q-76-9-151 15M441 328q-78-9-154 15"
          className="stroke-muted/50"
          strokeWidth="4"
        />
        <path d="M233 295q-72-24-146-15M233 319q-74-24-149-15" className="stroke-muted/50" strokeWidth="4" />
        <path d="M233 343q-40-13-78-16" className="stroke-brand" strokeWidth="4" />

        {/* Fountain pen, drawn upright with the nib at 0,0 */}
        <g transform="translate(155 327) rotate(34)">
          <path d="M0 0-17-42-12-62h24l5 20Z" className="fill-ink" />
          <path d="M0-4v-30" className="stroke-surface" strokeWidth="2" />
          <circle cy="-38" r="4" className="fill-surface" />
          <rect x="-16" y="-84" width="32" height="24" rx="5" className="fill-ink" />
          <path d="M-18-84h36l4-154q0-28-22-28t-22 28Z" className="fill-brand" />
          <path d="M-19-168h38" className="stroke-ink/40" strokeWidth="3" />
          <path d="M13-244v58" className="stroke-ink" strokeWidth="6" />
          <path d="M-8-102l-1-52" className="stroke-white/30" strokeWidth="5" />
        </g>
      </svg>
      <p className="mt-6 text-3xl font-bold">
        لكل فكرة <span className="text-brand">أفق</span>
      </p>
      <p className="mt-3 text-muted">اكتب، وشارك صوتك مع قرّاء يبحثون عن المعنى</p>
    </div>
  );
}
