"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { createSceneState, startHorizon, type SceneState } from "@/lib/horizon-scene";
import { useLocalSetting, writeLocalSetting } from "@/lib/local-setting";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/**
 * The moving, interactive horizon behind the home hero. Its parent must be
 * positioned. Still when the device asks for less motion, and can be paused.
 */
export function HeroHorizon({ words }: { words: readonly string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SceneState | null>(null);
  const stored = useLocalSetting("motion");
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => true, // still until hydrated
  );
  const running = stored === "on" || (stored !== "off" && !reduced);

  useEffect(() => {
    const element = canvas.current;
    if (!element?.parentElement) return;
    scene.current ??= createSceneState();
    return startHorizon(element, element.parentElement, scene.current, words, running);
  }, [words, running]);

  const label = running ? "إيقاف الحركة" : "تشغيل الحركة";
  const Icon = running ? Pause : Play;

  return (
    <>
      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full" />
      <button
        type="button"
        onClick={() => writeLocalSetting("motion", running ? "off" : "on")}
        aria-label={label}
        title={label}
        className="absolute end-3 bottom-10 rounded-full border border-line bg-surface/80 p-2.5 text-muted transition hover:text-brand"
      >
        <Icon className="size-4" aria-hidden />
      </button>
    </>
  );
}
