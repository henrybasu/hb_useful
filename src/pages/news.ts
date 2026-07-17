import "../styles/shared.css";
import "../styles/news.css";
import { escapeHtml } from "../lib/escape";
import { renderSiteNav } from "../lib/nav";
import {
  formatHeadlineTime,
  formatPaperDate,
  formatWireAsOf,
  getTopHeadlines,
  type Headline,
} from "../lib/news";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app missing");
const app = root;

function storyHtml(h: Headline, lead = false): string {
  const tag = lead ? "h2" : "h3";
  return `
    <article class="${lead ? "lead-story" : "story"}">
      <p class="story-meta">${escapeHtml(h.source)}${h.publishedAt ? ` · ${escapeHtml(formatHeadlineTime(h.publishedAt))}` : ""}</p>
      <${tag}><a href="${escapeHtml(h.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(h.title)}</a></${tag}>
      ${h.description ? `<p class="story-deck">${escapeHtml(h.description)}</p>` : ""}
    </article>`;
}

function renderPaper(headlines: Headline[], fetchedAt: string): void {
  const [lead, ...rest] = headlines;
  const grid = rest.map((h) => storyHtml(h)).join("");
  const wire = formatWireAsOf(fetchedAt);

  app.innerHTML = `
    ${renderSiteNav("news")}
    <main class="paper">
      <header class="masthead">
        <h1 class="masthead-title">The Daily Useful</h1>
        <p class="masthead-sub">All the news that’s fit to skim · Compiled using: <a class="source-link" href="https://gnews.io/" target="_blank" rel="noopener noreferrer">GNews</a></p>
        <div class="dateline">
          <span>${escapeHtml(formatPaperDate())}</span>
          <span>Vol. 1 · No. Today</span>
          <span>Price: Free</span>
        </div>
        ${wire ? `<p class="muted wire-as-of">Wire as of ${escapeHtml(wire)}</p>` : ""}
      </header>
      <section class="news-grid" aria-label="Today’s headlines">
        ${lead ? storyHtml(lead, true) : "<p>No headlines available.</p>"}
        ${grid}
      </section>
    </main>`;
}

function renderError(message: string): void {
  app.innerHTML = `
    ${renderSiteNav("news")}
    <main class="paper">
      <header class="masthead">
        <h1 class="masthead-title">The Daily Useful</h1>
        <p class="masthead-sub">Edition delayed</p>
        <div class="dateline">
          <span>${escapeHtml(formatPaperDate())}</span>
          <span>Please stand by</span>
        </div>
      </header>
      <p class="status-banner error">${escapeHtml(message)}</p>
      <p class="muted">Set <code>GNEWS_KEY</code> in <code>.env</code> (see <code>.env.example</code>), then run <code>npm run fetch-headlines</code>.</p>
    </main>`;
}

async function load(): Promise<void> {
  app.innerHTML = `
    ${renderSiteNav("news")}
    <main class="paper">
      <header class="masthead">
        <h1 class="masthead-title">The Daily Useful</h1>
        <p class="masthead-sub">Going to press…</p>
      </header>
      <p class="status-banner">Loading today’s headlines…</p>
    </main>`;

  try {
    const { headlines, fetchedAt } = await getTopHeadlines(10);
    renderPaper(headlines, fetchedAt);
  } catch (err) {
    renderError(err instanceof Error ? err.message : "Press wire down");
  }
}

void load();
