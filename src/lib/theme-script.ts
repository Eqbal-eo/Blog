/** Runs before paint (inlined in <head>) so the page never flashes. */
export const themeScript = `(() => {
  try {
    const t = localStorage.getItem("theme");
    const dark = t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();`;
