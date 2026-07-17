import { getTheme, initTheme } from "./theme";

export type SitePage = "dashboard" | "weather" | "stocks" | "news" | "about";

const LINKS: { id: SitePage; path: string; label: string }[] = [
  { id: "dashboard", path: "index.html", label: "Dashboard" },
  { id: "weather", path: "weather.html", label: "Weather" },
  { id: "stocks", path: "stocks.html", label: "Stocks" },
  { id: "news", path: "news.html", label: "News" },
  { id: "about", path: "about.html", label: "About" },
];

initTheme();

/** Relative base for site links — use ".." from nested pages like stocks/*.html */
export function siteNavBase(): string {
  const path = window.location.pathname;
  if (/\/stocks\/[^/]+\.html$/i.test(path)) return "..";
  return ".";
}

export function renderSiteNav(
  active: SitePage,
  base: string = siteNavBase(),
): string {
  const items = LINKS.map((link) => {
    const current = link.id === active ? ' aria-current="page"' : "";
    return `<a href="${base}/${link.path}"${current}>${link.label}</a>`;
  }).join("");

  const theme = getTheme();
  const next = theme === "dark" ? "light" : "dark";
  const pressed = theme === "dark" ? "true" : "false";
  const label = next === "dark" ? "Dark" : "Light";

  return `
    <nav class="site-nav" aria-label="Site">
      <a class="site-nav-brand" href="${base}/index.html">Home</a>
      <div class="site-nav-end">
        <div class="site-nav-links">${items}</div>
        <button
          type="button"
          class="theme-toggle"
          aria-pressed="${pressed}"
          aria-label="Switch to ${next} mode"
        >
          <span class="theme-toggle-text">${label}</span>
        </button>
      </div>
    </nav>`;
}
