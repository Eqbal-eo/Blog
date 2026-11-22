"use client";

import { useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { button } from "@/components/ui/styles";
import { useLocalSetting, writeLocalSetting } from "@/lib/local-setting";

type Theme = "light" | "dark" | "system";

const ORDER: Theme[] = ["light", "dark", "system"];
const LABELS: Record<Theme, string> = {
  system: "المظهر: حسب الجهاز",
  light: "المظهر: فاتح",
  dark: "المظهر: داكن",
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia(DARK_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  // null until hydrated; the inline head script already set the class on load
  const stored = useLocalSetting("theme");
  const theme: Theme = stored === "dark" || stored === "system" ? stored : "light";

  // While on "system", follow OS changes live
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    writeLocalSetting("theme", next);
    apply(next);
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      className={button.ghost}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
