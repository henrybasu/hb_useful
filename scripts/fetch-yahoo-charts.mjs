/**
 * Build-time Yahoo chart snapshots for GitHub Pages.
 * Browsers cannot call Yahoo live (CORS); Vite proxies only in local dev.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/yahoo-charts.json");
const stocksTs = readFileSync(join(ROOT, "src/lib/stocks.ts"), "utf8");

const SYMBOLS = [
  ...stocksTs.matchAll(/^\s*symbol:\s*"([^"]+)"/gm),
].map((m) => m[1]);

const RANGES = [
  { range: "1d", interval: "5m" },
  { range: "5d", interval: "15m" },
  { range: "1mo", interval: "1d" },
  { range: "3mo", interval: "1d" },
  { range: "6mo", interval: "1d" },
  { range: "1y", interval: "1d" },
  { range: "5y", interval: "1wk" },
  { range: "10y", interval: "1wk" },
  { range: "max", interval: "1mo" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pointsFromResult(result) {
  const timestamps = result?.timestamp ?? [];
  const adj = result?.indicators?.adjclose?.[0]?.adjclose;
  const raw = result?.indicators?.quote?.[0]?.close;
  const closes = adj ?? raw ?? [];
  const points = [];
  const len = Math.min(timestamps.length, closes.length);
  for (let i = 0; i < len; i++) {
    const t = timestamps[i];
    const price = closes[i];
    if (
      typeof t === "number" &&
      typeof price === "number" &&
      Number.isFinite(price)
    ) {
      points.push({ t, price });
    }
  }
  return points;
}

async function fetchChart(symbol, range, interval) {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
  );
  url.searchParams.set("interval", interval);
  url.searchParams.set("range", range);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 hb-useful-build" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.chart?.error?.description) {
    throw new Error(data.chart.error.description);
  }
  const result = data.chart?.result?.[0];
  const points = pointsFromResult(result);
  if (points.length < 2) {
    throw new Error("not enough points");
  }
  return {
    points,
    currency: result?.meta?.currency ?? "USD",
  };
}

if (SYMBOLS.length === 0) {
  console.error("No symbols found in src/lib/stocks.ts");
  process.exit(1);
}

const series = {};
const errors = [];

for (const symbol of SYMBOLS) {
  for (const { range, interval } of RANGES) {
    const key = `${symbol}|${range}`;
    try {
      series[key] = await fetchChart(symbol, range, interval);
      console.log(`ok ${key} (${series[key].points.length})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${key}: ${msg}`);
      console.error(`fail ${key}: ${msg}`);
    }
    await sleep(120);
  }
}

const payload = {
  fetchedAt: new Date().toISOString(),
  series,
  errors,
};

writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
console.log(
  `wrote ${OUT} (${Object.keys(series).length} series, ${errors.length} errors)`,
);

if (Object.keys(series).length === 0) {
  process.exitCode = 1;
}
