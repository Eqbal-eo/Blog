import "server-only";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 };

/*
 * Share images are drawn with sharp's text renderer (Pango), which shapes
 * Arabic and lays it out right to left correctly. (The JSX-based
 * ImageResponse joins the letters but spaces Arabic words unevenly.)
 *
 * Fonts: Tajawal (OFL) in src/assets/fonts. A private fontconfig file makes
 * Pango use them, Arabic and Latin subsets together, on any host.
 */
const FONT_DIR = join(process.cwd(), "src/assets/fonts");
const ARABIC_BOLD = join(FONT_DIR, "tajawal-arabic-700.ttf");

let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  if (!process.env.FONTCONFIG_FILE) {
    const dir = join(tmpdir(), "afaq-fontconfig");
    mkdirSync(join(dir, "cache"), { recursive: true });
    const conf = join(dir, "fonts.conf");
    writeFileSync(
      conf,
      `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>${join(dir, "cache")}</cachedir>
</fontconfig>
`,
    );
    process.env.FONTCONFIG_FILE = conf;
  }
  fontsReady = true;
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Renders right-aligned text to a transparent PNG at most `width` wide. */
async function textLayer(
  text: string,
  { size, color, bold = true, width }: { size: number; color: string; bold?: boolean; width: number },
) {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${escape(text)}</span>`,
      font: `Tajawal ${bold ? "Bold" : "Regular"} ${size}`,
      fontfile: ARABIC_BOLD,
      width,
      // Pango mirrors alignment for right-to-left paragraphs: "left" here
      // puts each Arabic line flush against the right edge
      align: "left",
      wrap: "word",
      spacing: Math.round(size * 0.35),
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { input: data, width: info.width, height: info.height };
}

/** Branded 1200×630 share card: eyebrow line, big title, footer line. */
export async function ogCard({
  eyebrow,
  title,
  footer,
}: {
  eyebrow?: string;
  title: string;
  footer?: string;
}): Promise<Response> {
  ensureFonts();

  const { width: W, height: H } = OG_SIZE;
  const pad = 80;
  const inner = W - pad * 2;
  const clipped = title.length > 110 ? `${title.slice(0, 107)}…` : title;
  const titleSize = clipped.length > 70 ? 56 : clipped.length > 40 ? 66 : 78;

  const [top, main, author, brand] = await Promise.all([
    textLayer(eyebrow ?? "مدونات آفاق", { size: 34, color: "#8c4a21", width: inner }),
    textLayer(clipped, { size: titleSize, color: "#222222", width: inner }),
    footer ? textLayer(footer, { size: 30, color: "#6a6969", bold: false, width: inner / 2 }) : null,
    textLayer("مدونات آفاق", { size: 30, color: "#6a6969", width: inner / 2 }),
  ]);

  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#f9f7f0"/>
      <rect y="${H - 16}" width="${W}" height="16" fill="#8c4a21"/>
    </svg>`,
  );

  const footerTop = H - 16 - 64 - brand.height;
  const layers = [
    // Right-aligned: left edge = right margin minus the layer's own width
    { ...top, top: 72, left: W - pad - top.width },
    { ...main, top: Math.round((H - main.height) / 2), left: W - pad - main.width },
    { ...brand, top: footerTop, left: pad },
    ...(author ? [{ ...author, top: footerTop, left: W - pad - author.width }] : []),
  ];

  const png = await sharp(background)
    .composite(layers.map(({ input, top: y, left }) => ({ input, top: y, left })))
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
