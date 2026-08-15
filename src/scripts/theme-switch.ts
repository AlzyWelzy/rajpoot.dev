import {
  themeState,
  toggleTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/stores/theme";

const button = document.getElementById("theme-switch");
if (button) {
  const sun = button.querySelector<SVGElement>('[data-icon="sun"]');
  const moon = button.querySelector<SVGElement>('[data-icon="moon"]');

  // Both icons share the same transition classes; only these three vary,
  // so swapping them is the whole crossfade.
  const SHOWN = ["rotate-0", "scale-100", "opacity-100"];
  const HIDDEN_SUN = ["-rotate-90", "scale-50", "opacity-0"];
  const HIDDEN_MOON = ["rotate-90", "scale-50", "opacity-0"];

  function render(theme: Theme) {
    const isDark = theme === "dark";
    const next = isDark ? "light" : "dark";
    button!.setAttribute("aria-label", `Switch to ${next} mode`);
    button!.setAttribute("title", `Switch to ${next} mode`);
    button!.setAttribute("aria-pressed", String(isDark));

    sun?.classList.remove(...SHOWN, ...HIDDEN_SUN);
    sun?.classList.add(...(isDark ? HIDDEN_SUN : SHOWN));
    moon?.classList.remove(...SHOWN, ...HIDDEN_MOON);
    moon?.classList.add(...(isDark ? SHOWN : HIDDEN_MOON));
  }

  render(themeState.value);
  subscribeTheme(render);
  button.addEventListener("click", () => toggleTheme());
}
