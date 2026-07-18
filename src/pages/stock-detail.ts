import "../styles/shared.css";
import "../styles/stock-detail.css";
import { escapeHtml } from "../lib/escape";
import { renderSiteNav } from "../lib/nav";
import {
  CHART_RANGES,
  findWatchItemBySlug,
  formatChange,
  formatPercent,
  formatPrice,
  getChartSeries,
  getQuote,
  type ChartPoint,
  type ChartRange,
  type ChartSeries,
  type StockQuote,
  type WatchItem,
} from "../lib/stocks";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app missing");
const app = root;

function slugFromPath(): string {
  const file = window.location.pathname.split("/").pop() ?? "";
  return decodeURIComponent(file.replace(/\.html$/i, ""));
}

function changeClass(n: number): string {
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "flat";
}

function kindLabel(kind: WatchItem["kind"]): string {
  if (kind === "index") return "Index / fund";
  if (kind === "semiconductor") return "Semiconductor";
  return "Individual stock";
}

function formatChartTime(ts: number, range: ChartRange): string {
  const d = new Date(ts * 1000);
  if (range === "1d" || range === "5d") {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ChartLayout = {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  min: number;
  max: number;
  points: ChartPoint[];
  xs: number[];
  ys: number[];
};

function layoutChart(
  points: ChartPoint[],
  width: number,
  height: number,
): ChartLayout {
  const padL = 12;
  const padR = 12;
  const padT = 16;
  const padB = 16;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const xs = points.map((_, i) => {
    return padL + (i / (points.length - 1)) * (width - padL - padR);
  });
  const ys = points.map((p) => {
    return padT + (1 - (p.price - min) / range) * (height - padT - padB);
  });
  return { width, height, padL, padR, padT, padB, min, max, points, xs, ys };
}

function nearestIndex(layout: ChartLayout, clientX: number, rect: DOMRect): number {
  const x = ((clientX - rect.left) / rect.width) * layout.width;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < layout.xs.length; i++) {
    const dist = Math.abs(layout.xs[i]! - x);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

function renderChartSvg(layout: ChartLayout, trend: "up" | "down" | "flat"): string {
  const { width, height, points, xs, ys } = layout;
  const line = points
    .map((_, i) => `${xs[i]!.toFixed(1)},${ys[i]!.toFixed(1)}`)
    .join(" ");
  const area = `${xs[0]!.toFixed(1)},${height - layout.padB} ${line} ${xs[xs.length - 1]!.toFixed(1)},${height - layout.padB}`;

  return `
    <svg class="detail-chart-svg trend-${trend}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Price chart">
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.28" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polygon class="chart-area" points="${area}" fill="url(#chart-fill)" />
      <polyline class="chart-line" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" points="${line}" />
      <line class="chart-crosshair" x1="0" y1="${layout.padT}" x2="0" y2="${height - layout.padB}" hidden />
      <circle class="chart-dot" r="4.5" cx="0" cy="0" hidden />
    </svg>`;
}

function bindChartInteractions(
  wrap: HTMLElement,
  layout: ChartLayout,
  range: ChartRange,
  currency: string,
): void {
  const svg = wrap.querySelector<SVGSVGElement>(".detail-chart-svg");
  const crosshair = wrap.querySelector<SVGLineElement>(".chart-crosshair");
  const dot = wrap.querySelector<SVGCircleElement>(".chart-dot");
  const tip = wrap.querySelector<HTMLElement>(".chart-tooltip");
  if (!svg || !crosshair || !dot || !tip) return;

  const showAt = (index: number, clientX: number, clientY: number): void => {
    const point = layout.points[index];
    const x = layout.xs[index];
    const y = layout.ys[index];
    if (!point || x == null || y == null) return;

    crosshair.removeAttribute("hidden");
    dot.removeAttribute("hidden");
    tip.hidden = false;
    crosshair.setAttribute("x1", String(x));
    crosshair.setAttribute("x2", String(x));
    dot.setAttribute("cx", String(x));
    dot.setAttribute("cy", String(y));
    tip.innerHTML = `<strong>${escapeHtml(formatPrice(point.price, currency))}</strong><span>${escapeHtml(formatChartTime(point.t, range))}</span>`;

    const rect = wrap.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    let left = localX + 14;
    let top = localY - tipH - 12;
    if (left + tipW > rect.width - 8) left = localX - tipW - 14;
    if (top < 8) top = localY + 16;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  };

  const hide = (): void => {
    crosshair.setAttribute("hidden", "");
    dot.setAttribute("hidden", "");
    tip.hidden = true;
  };

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const index = nearestIndex(layout, e.clientX, rect);
    showAt(index, e.clientX, e.clientY);
  });
  svg.addEventListener("mouseleave", hide);
  svg.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const index = nearestIndex(layout, touch.clientX, rect);
      showAt(index, touch.clientX, touch.clientY);
    },
    { passive: false },
  );
  svg.addEventListener("touchend", hide);
}

function rangeButtons(active: ChartRange): string {
  return CHART_RANGES.map((r) => {
    const pressed = r.id === active ? ' aria-pressed="true"' : ' aria-pressed="false"';
    return `<button type="button" class="range-btn" data-range="${r.id}"${pressed}>${r.label}</button>`;
  }).join("");
}

function shell(
  item: WatchItem,
  quote: StockQuote | null,
  series: ChartSeries | null,
  range: ChartRange,
  chartError: string | null,
): string {
  const cls = quote ? changeClass(quote.percentChange) : "flat";
  const currency = series?.currency ?? "USD";
  const points = series?.points;
  const first = points?.[0]?.price;
  const last = points?.[points.length - 1]?.price;
  const trend: "up" | "down" | "flat" =
    first != null && last != null
      ? last > first
        ? "up"
        : last < first
          ? "down"
          : "flat"
      : "flat";

  let chartBody = `<p class="detail-chart-status">Loading chart…</p>`;
  if (chartError) {
    chartBody = `<p class="detail-chart-status error">${escapeHtml(chartError)}</p>`;
  } else if (series) {
    const layout = layoutChart(series.points, 720, 320);
    chartBody = `
      <div class="detail-chart-frame">
        ${renderChartSvg(layout, trend)}
        <div class="chart-tooltip" hidden></div>
      </div>`;
  }

  const quoteBlock = quote
    ? `
      <div class="detail-quote">
        <span class="detail-price">${escapeHtml(formatPrice(quote.price, currency))}</span>
        <span class="detail-change ${cls}">${escapeHtml(formatChange(quote.change, currency))} (${escapeHtml(formatPercent(quote.percentChange))})</span>
      </div>
      <p class="detail-stats">Open ${escapeHtml(formatPrice(quote.open, currency))} · High ${escapeHtml(formatPrice(quote.high, currency))} · Low ${escapeHtml(formatPrice(quote.low, currency))} · Prev ${escapeHtml(formatPrice(quote.previousClose, currency))}</p>`
    : `<p class="detail-chart-status">Loading quote…</p>`;

  const yahooQuoteUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`;
  const sources = `Source: <a class="source-link" href="https://finnhub.io/" target="_blank" rel="noopener noreferrer">Finnhub</a>, <a class="source-link" href="${yahooQuoteUrl}" target="_blank" rel="noopener noreferrer">Yahoo Finance</a>.`;

  return `
    ${renderSiteNav("stocks")}
    <main class="stock-detail-page">
      <p class="page-kicker"><a class="back-link" href="../stocks.html">← Market board</a></p>
      <p class="detail-kind">${escapeHtml(kindLabel(item.kind))}</p>
      <h1 class="page-title">${escapeHtml(item.label)}</h1>
      <p class="detail-symbol">${escapeHtml(item.symbol)}</p>
      ${quoteBlock}
      <p class="detail-source">${sources}</p>
      <section class="detail-summary" aria-label="About">
        <h2 class="detail-section-title">About</h2>
        <p>${escapeHtml(item.summary)}</p>
      </section>
      <section class="detail-chart-section" aria-label="Price chart">
        <div class="detail-chart-header">
          <h2 class="detail-section-title">Price chart</h2>
          <div class="range-toggle" role="group" aria-label="Chart time frame">${rangeButtons(range)}</div>
        </div>
        ${chartBody}
        <p class="detail-chart-note">Hover or drag to see price at a point in time. Charts via <a class="source-link" href="https://finnhub.io/" target="_blank" rel="noopener noreferrer">Finnhub</a> or a <a class="source-link" href="${yahooQuoteUrl}" target="_blank" rel="noopener noreferrer">Yahoo Finance</a> build snapshot.</p>
      </section>
    </main>`;
}

async function boot(): Promise<void> {
  const slug = slugFromPath();
  const item = findWatchItemBySlug(slug);

  if (!item) {
    app.innerHTML = `
      ${renderSiteNav("stocks")}
      <main class="stock-detail-page">
        <p class="page-kicker"><a class="back-link" href="../stocks.html">← Market board</a></p>
        <h1 class="page-title">Not found</h1>
        <p class="detail-chart-status error">No watchlist entry for “${escapeHtml(slug)}”.</p>
      </main>`;
    return;
  }

  document.title = `${item.label} — Stocks — hb_useful`;

  let range: ChartRange = "6mo";
  let quote: StockQuote | null = null;
  let series: ChartSeries | null = null;
  let chartError: string | null = null;

  const paint = (): void => {
    app.innerHTML = shell(item, quote, series, range, chartError);
    const frame = app.querySelector<HTMLElement>(".detail-chart-frame");
    if (frame && series) {
      const layout = layoutChart(series.points, 720, 320);
      bindChartInteractions(frame, layout, range, series.currency);
    }
    app.querySelectorAll<HTMLButtonElement>(".range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.range as ChartRange | undefined;
        if (!next || next === range) return;
        range = next;
        void loadChart();
      });
    });
  };

  const loadChart = async (): Promise<void> => {
    chartError = null;
    series = null;
    paint();
    try {
      series = await getChartSeries(item.symbol, range);
    } catch (err) {
      chartError =
        err instanceof Error ? err.message : "Could not load chart data";
    }
    paint();
  };

  paint();

  try {
    quote = await getQuote(item);
  } catch {
    quote = null;
  }
  paint();
  await loadChart();
}

void boot();
