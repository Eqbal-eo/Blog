/**
 * Runs before paint (inlined in <head>) so the page never flashes.
 * Light unless the visitor chose dark, or chose to follow a dark device.
 */
export const themeScript = `(() => {
  try {
    const t = localStorage.getItem("theme");
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();`;
