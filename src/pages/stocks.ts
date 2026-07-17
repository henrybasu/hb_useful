import "../styles/shared.css";
import "../styles/stocks.css";
import { escapeHtml } from "../lib/escape";
import { renderSiteNav } from "../lib/nav";
import {
  currencyForSymbol,
  formatChange,
  formatPercent,
  formatPrice,
  findWatchItemBySymbol,
  getWatchlistQuotes,
  INDEX_SYMBOLS,
  SEMICONDUCTOR_SYMBOLS,
  sparklineSvg,
  type StockQuote,
} from "../lib/stocks";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app missing");
const app = root;

const REFRESH_MS = 60_000;

function changeClass(n: number): string {
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "flat";
}

function quoteRows(quotes: StockQuote[]): string {
  return quotes
    .map((q) => {
      const cls = changeClass(q.percentChange);
      const item = findWatchItemBySymbol(q.symbol);
      const href = item ? `./stocks/${encodeURIComponent(item.slug)}.html` : "#";
      const currency = currencyForSymbol(q.symbol);
      return `
        <a class="quote-row" href="${href}">
          <span class="quote-symbol">${escapeHtml(q.label)}</span>
          ${sparklineSvg(q.history)}
          <span class="quote-price">${escapeHtml(formatPrice(q.price, currency))}</span>
          <span class="quote-change ${cls}">${escapeHtml(formatChange(q.change, currency))}</span>
          <span class="quote-change ${cls}">${escapeHtml(formatPercent(q.percentChange))}</span>
          <span class="quote-meta">H ${formatPrice(q.high, currency)} · L ${formatPrice(q.low, currency)} · Prev ${formatPrice(q.previousClose, currency)}</span>
        </a>`;
    })
    .join("");
}

function renderQuotes(quotes: StockQuote[], updatedAt: string): void {
  const indices = quotes.filter((q) => INDEX_SYMBOLS.has(q.symbol));
  const semiconductors = quotes.filter((q) =>
    SEMICONDUCTOR_SYMBOLS.has(q.symbol),
  );
  const stocks = quotes.filter(
    (q) => !INDEX_SYMBOLS.has(q.symbol) && !SEMICONDUCTOR_SYMBOLS.has(q.symbol),
  );

  const tape = quotes
    .map(
      (q) =>
        `${q.label} ${formatPrice(q.price)} ${formatPercent(q.percentChange)}`,
    )
    .join("   ★   ");

  const sources = `Source: <a class="source-link" href="https://finnhub.io/" target="_blank" rel="noopener noreferrer">Finnhub</a>, <a class="source-link" href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a>.`;

  app.innerHTML = `
    ${renderSiteNav("stocks")}
    <main class="stocks-page">
      <p class="page-kicker">Watchlist</p>
      <h1 class="page-title">Market board</h1>
      <p class="quote-meta-line">Refreshes every minute · Updated ${escapeHtml(updatedAt)} · ${sources}</p>
      <div class="quote-columns">
        <section class="quote-board" aria-label="Index funds">
          <h2 class="quote-column-title">Index funds</h2>
          ${quoteRows(indices)}
        </section>
        <section class="quote-board" aria-label="Individual stocks">
          <h2 class="quote-column-title">Individual stocks</h2>
          ${quoteRows(stocks)}
        </section>
        <section class="quote-board" aria-label="Semiconductors">
          <h2 class="quote-column-title">Semiconductors</h2>
          ${quoteRows(semiconductors)}
        </section>
      </div>
      <div class="tape" aria-hidden="true">
        <span class="tape-inner">${escapeHtml(tape)}&nbsp;&nbsp;&nbsp;${escapeHtml(tape)}</span>
      </div>
    </main>`;
}

function renderError(message: string): void {
  app.innerHTML = `
    ${renderSiteNav("stocks")}
    <main class="stocks-page">
      <p class="page-kicker">Watchlist</p>
      <h1 class="page-title">Market board</h1>
      <p class="quote-meta-line error">${escapeHtml(message)}</p>
      <p class="muted">Set <code>VITE_FINNHUB_KEY</code> in <code>.env</code> (see <code>.env.example</code>), then rebuild.</p>
    </main>`;
}

async function load(): Promise<void> {
  app.innerHTML = `
    ${renderSiteNav("stocks")}
    <main class="stocks-page">
      <p class="page-kicker">Watchlist</p>
      <h1 class="page-title">Market board</h1>
      <p class="quote-meta-line">Fetching quotes…</p>
    </main>`;

  try {
    const quotes = await getWatchlistQuotes();
    renderQuotes(quotes, new Date().toLocaleTimeString());
  } catch (err) {
    renderError(err instanceof Error ? err.message : "Quote feed unavailable");
  }
}

void load();
window.setInterval(() => {
  void load();
}, REFRESH_MS);
