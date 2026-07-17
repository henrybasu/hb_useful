import "../styles/shared.css";
import "../styles/dashboard.css";
import { escapeHtml } from "../lib/escape";
import { renderSiteNav } from "../lib/nav";
import { getForecast, type ForecastBundle } from "../lib/openMeteo";
import { hourLabel, roundTemp, weatherLook } from "../lib/weatherCodes";
import {
  currencyForSymbol,
  formatPercent,
  formatPrice,
  getWatchlistQuotes,
  INDEX_SYMBOLS,
  SEMICONDUCTOR_SYMBOLS,
  type StockQuote,
} from "../lib/stocks";
import { getTopHeadlines, type HeadlinesSnapshot } from "../lib/news";

const SAN_JOSE = { latitude: 37.3382, longitude: -121.8863 };

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app missing");
const app = root;

type MiniResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function weatherMini(result: MiniResult<ForecastBundle>): string {
  if (!result.ok) {
    return `<p class="tile-error">${escapeHtml(result.message)}</p>`;
  }
  const { current, hourly, daily, timezone } = result.data;
  const look = weatherLook(current.weatherCode);
  const today = daily[0];
  const hiLo = today
    ? `<p class="mini-wx-hilo">H ${roundTemp(today.tempMax)}° · L ${roundTemp(today.tempMin)}°</p>`
    : "";
  const hours = hourly
    .map((h) => {
      const hourLook = weatherLook(h.weatherCode);
      return `
        <div class="mini-hour">
          <span class="mini-hour-time">${escapeHtml(hourLabel(h.time, timezone))}</span>
          <span class="mini-hour-icon" aria-hidden="true">${hourLook.icon}</span>
          <span class="mini-hour-temp">${roundTemp(h.temperature)}°</span>
          <span class="mini-hour-precip">${roundTemp(h.precipProb)}%</span>
        </div>`;
    })
    .join("");

  return `
    <div class="mini-wx-summary">
      <p class="mini-wx-temp">${roundTemp(current.temperature)}°F</p>
      <p class="mini-wx-cond">${escapeHtml(look.label)} · San Jose</p>
      ${hiLo}
    </div>
    <div class="mini-hour-list" aria-label="Hourly forecast">${hours}</div>`;
}

function stocksMini(result: MiniResult<StockQuote[]>): string {
  if (!result.ok) {
    return `<p class="tile-error">${escapeHtml(result.message)}</p>`;
  }

  const quoteRow = (q: StockQuote): string => {
    const cls =
      q.percentChange > 0 ? "mini-up" : q.percentChange < 0 ? "mini-down" : "";
    return `
      <div class="mini-quote">
        <span>${escapeHtml(q.label)}</span>
        <span>${escapeHtml(formatPrice(q.price, currencyForSymbol(q.symbol)))}</span>
        <span class="${cls}">${escapeHtml(formatPercent(q.percentChange))}</span>
      </div>`;
  };

  const indices = result.data.filter((q) => INDEX_SYMBOLS.has(q.symbol));
  const semiconductors = result.data.filter((q) =>
    SEMICONDUCTOR_SYMBOLS.has(q.symbol),
  );
  const stocks = result.data.filter(
    (q) => !INDEX_SYMBOLS.has(q.symbol) && !SEMICONDUCTOR_SYMBOLS.has(q.symbol),
  );

  const group = (title: string, quotes: StockQuote[]): string => {
    if (quotes.length === 0) return "";
    return `
      <div class="mini-quote-group">
        <h3 class="mini-quote-heading">${escapeHtml(title)}</h3>
        ${quotes.map(quoteRow).join("")}
      </div>`;
  };

  return `
    <div class="mini-quote-list">
      ${group("Index funds", indices)}
      ${group("Individual stocks", stocks)}
      ${group("Semiconductors", semiconductors)}
    </div>`;
}

function newsMini(result: MiniResult<HeadlinesSnapshot>): string {
  if (!result.ok) {
    return `<p class="tile-error">${escapeHtml(result.message)}</p>`;
  }
  const items = result.data.headlines
    .map(
      (h) => `
        <article class="mini-headline">
          <p class="mini-headline-source">${escapeHtml(h.source)}</p>
          <p class="mini-headline-title">${escapeHtml(h.title)}</p>
        </article>`,
    )
    .join("");
  return `<div class="mini-headline-list">${items}</div>`;
}

function panelShell(id: string, label: string, href: string, body: string): string {
  return `
    <a class="dash-tile ${id}-tile" href="${href}">
      <span class="tile-label">${label}</span>
      <div class="tile-body" data-panel="${id}">${body}</div>
    </a>`;
}

function renderShell(): void {
  app.innerHTML = `
    ${renderSiteNav("dashboard")}
    <main class="dash">
      <section class="dash-grid" aria-label="Dashboard panels">
        ${panelShell("weather", "Weather", "./weather.html", `<p class="dash-loading">Loading…</p>`)}
        ${panelShell("stocks", "Stocks", "./stocks.html", `<p class="dash-loading">Loading…</p>`)}
        ${panelShell("news", "News", "./news.html", `<p class="dash-loading">Loading…</p>`)}
      </section>
    </main>`;
}

function setPanel(id: string, html: string): void {
  const el = app.querySelector(`[data-panel="${id}"]`);
  if (el) el.innerHTML = html;
}

async function wrap<T>(fn: () => Promise<T>): Promise<MiniResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unavailable",
    };
  }
}

async function load(): Promise<void> {
  renderShell();

  void wrap(() => getForecast(SAN_JOSE.latitude, SAN_JOSE.longitude)).then(
    (weather) => setPanel("weather", weatherMini(weather)),
  );
  void wrap(() => getWatchlistQuotes()).then((stocks) =>
    setPanel("stocks", stocksMini(stocks)),
  );
  void wrap(() => getTopHeadlines(24)).then((news) =>
    setPanel("news", newsMini(news)),
  );
}

void load();
