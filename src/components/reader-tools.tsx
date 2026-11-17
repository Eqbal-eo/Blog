"use client";

import { useEffect, useState } from "react";
import { AArrowDown, AArrowUp } from "lucide-react";
import { button } from "@/components/ui/styles";
import { useLocalSetting, writeLocalSetting } from "@/lib/local-setting";

const SCALES = [0.9, 1, 1.12, 1.25, 1.4];

/** Thin bar at the top of the page showing how far the reader has scrolled. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-30 h-1 origin-right bg-brand transition-transform duration-75"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}

/** A− / A+ buttons that scale the article text; remembered per browser. */
export function FontSizeControl() {
  const raw = useLocalSetting("reader-scale-index");
  const stored = raw === null ? NaN : Number(raw);
  const index = Number.isInteger(stored) && stored >= 0 && stored < SCALES.length ? stored : 1;

  // Apply the scale to the page (a CSS variable read by .article-body)
  useEffect(() => {
    document.documentElement.style.setProperty("--reader-scale", String(SCALES[index]));
  }, [index]);

  const change = (delta: number) => {
    const next = Math.min(SCALES.length - 1, Math.max(0, index + delta));
    writeLocalSetting("reader-scale-index", String(next));
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label="حجم الخط">
      <button
        type="button"
        onClick={() => change(-1)}
        disabled={index === 0}
        className={button.ghost}
        aria-label="تصغير الخط"
        title="تصغير الخط"
      >
        <AArrowDown className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => change(1)}
        disabled={index === SCALES.length - 1}
        className={button.ghost}
        aria-label="تكبير الخط"
        title="تكبير الخط"
      >
        <AArrowUp className="size-5" aria-hidden />
      </button>
    </div>
  );
}
