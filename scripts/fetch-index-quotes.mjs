import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/index-quotes.json");

// Yahoo symbols that browsers cannot fetch live on GitHub Pages (CORS).
// Snapshotted at build time into public/index-quotes.json.
const SYMBOLS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^DJI", label: "DOW JONES" },
  { symbol: "^IXIC", label: "NASDAQ" },
  { symbol: "VTSAX", label: "VTSAX" },
  { symbol: "005930.KS", label: "Samsung" },
  { symbol: "000660.KS", label: "SK Hynix" },
];

async function fetchYahoo(symbol, label) {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "5d");

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 hb-useful-build" },
  });
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice && meta?.regularMarketPrice !== 0) {
    throw new Error(
      `${label}: ${data.chart?.error?.description ?? "no price in Yahoo response"}`,
    );
  }

  const price = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - previousClose;
  const percentChange = previousClose ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    label,
    price,
    change,
    percentChange,
    high: meta.regularMarketDayHigh ?? price,
    low: meta.regularMarketDayLow ?? price,
    open: meta.regularMarketOpen ?? price,
    previousClose,
    timestamp: meta.regularMarketTime ?? Math.floor(Date.now() / 1000),
  };
}

const quotes = [];
const errors = [];

for (const item of SYMBOLS) {
  try {
    quotes.push(await fetchYahoo(item.symbol, item.label));
    console.log(`ok ${item.label}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    console.error(`fail ${msg}`);
  }
}

const payload = {
  fetchedAt: new Date().toISOString(),
  quotes,
  errors,
};

writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`wrote ${OUT} (${quotes.length} quotes)`);

if (quotes.length === 0) {
  process.exitCode = 1;
}
