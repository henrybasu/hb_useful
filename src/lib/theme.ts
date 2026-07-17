export type Theme = "light" | "dark";

const STORAGE_KEY = "hb-theme";

export function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return "light";
}

export function resolveTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  syncThemeToggles();
}

export function toggleTheme(): void {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

export function syncThemeToggles(): void {
  const theme = getTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";
  document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((btn) => {
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    btn.setAttribute("aria-label", `Switch to ${next} mode`);
    const label = btn.querySelector(".theme-toggle-text");
    if (label) label.textContent = next === "dark" ? "Dark" : "Light";
  });
}

let bound = false;

export function initTheme(): void {
  if (!document.documentElement.hasAttribute("data-theme")) {
    document.documentElement.setAttribute("data-theme", resolveTheme());
  }

  if (!bound) {
    bound = true;
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".theme-toggle")) return;
      event.preventDefault();
      toggleTheme();
    });
  }

  syncThemeToggles();
}
