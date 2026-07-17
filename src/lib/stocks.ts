/** Finnhub + Yahoo quote client. */

export type StockQuote = {
  symbol: string;
  label: string;
  price: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  /** Daily closes over ~6 months for sparklines (oldest → newest). */
  history?: number[];
};

export type WatchItem = {
  symbol: string;
  label: string;
  /** URL slug for /stocks/{slug}.html */
  slug: string;
  /** Short plain-language description for the detail page. */
  summary: string;
  /** Finnhub free tier cannot quote major indices or most mutual funds. */
  source: "finnhub" | "yahoo";
  kind: "index" | "stock" | "semiconductor";
};

export type ChartRange =
  | "1d"
  | "5d"
  | "1mo"
  | "3mo"
  | "6mo"
  | "1y"
  | "5y"
  | "10y"
  | "max";

export type ChartPoint = {
  t: number;
  price: number;
};

export type ChartSeries = {
  points: ChartPoint[];
  currency: string;
};

/** Indices & VTSAX via Yahoo; liquid ETFs/stocks via Finnhub. */
export const WATCHLIST: readonly WatchItem[] = [
  {
    symbol: "^GSPC",
    label: "S&P 500",
    slug: "SP500",
    summary:
      "The S&P 500 tracks 500 of the largest U.S. publicly traded companies, weighted by market capitalization. It is the most widely followed benchmark for the overall U.S. equity market.",
    source: "yahoo",
    kind: "index",
  },
  {
    symbol: "^DJI",
    label: "DOW JONES",
    slug: "DOW",
    summary:
      "The Dow Jones Industrial Average follows 30 large, blue-chip U.S. companies. It is a price-weighted index and one of the oldest measures of U.S. stock market performance.",
    source: "yahoo",
    kind: "index",
  },
  {
    symbol: "^IXIC",
    label: "NASDAQ",
    slug: "NASDAQ",
    summary:
      "The Nasdaq Composite includes nearly all stocks listed on the Nasdaq exchange. It is heavily tilted toward technology and growth companies.",
    source: "yahoo",
    kind: "index",
  },
  {
    symbol: "VOO",
    label: "VOO",
    slug: "VOO",
    summary:
      "Vanguard S&P 500 ETF seeks to track the S&P 500 Index, giving investors broad exposure to large-cap U.S. stocks in a single, low-cost fund.",
    source: "finnhub",
    kind: "index",
  },
  {
    symbol: "QQQ",
    label: "QQQ",
    slug: "QQQ",
    summary:
      "Invesco QQQ tracks the Nasdaq-100 Index of the largest non-financial companies listed on Nasdaq, with heavy weight in technology and consumer growth names.",
    source: "finnhub",
    kind: "index",
  },
  {
    symbol: "SPY",
    label: "SPY",
    slug: "SPY",
    summary:
      "SPDR S&P 500 ETF Trust is one of the most liquid funds tracking the S&P 500. It is widely used by traders and long-term investors for U.S. large-cap exposure.",
    source: "finnhub",
    kind: "index",
  },
  {
    symbol: "VT",
    label: "VT",
    slug: "VT",
    summary:
      "Vanguard Total World Stock ETF holds thousands of stocks across developed and emerging markets, aiming for near-complete global equity coverage in one fund.",
    source: "finnhub",
    kind: "index",
  },
  {
    symbol: "VTI",
    label: "VTI",
    slug: "VTI",
    summary:
      "Vanguard Total Stock Market ETF tracks the entire U.S. equity market, including large-, mid-, and small-cap stocks, for broad domestic diversification.",
    source: "finnhub",
    kind: "index",
  },
  {
    symbol: "VTSAX",
    label: "VTSAX",
    slug: "VTSAX",
    summary:
      "Vanguard Total Stock Market Index Fund Admiral Shares is a mutual fund that owns virtually the full U.S. stock market, similar in scope to VTI but in mutual-fund form.",
    source: "yahoo",
    kind: "index",
  },
  {
    symbol: "AAPL",
    label: "AAPL",
    slug: "AAPL",
    summary:
      "Apple designs and sells the iPhone, Mac, iPad, wearables, and related services. Its business mixes hardware, the App Store, iCloud, Apple Music, and other recurring services.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "MSFT",
    label: "MSFT",
    slug: "MSFT",
    summary:
      "Microsoft builds Windows, Office, Azure cloud services, LinkedIn, gaming (Xbox), and enterprise software. Cloud and productivity subscriptions are central growth drivers.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "GOOGL",
    label: "GOOGL",
    slug: "GOOGL",
    summary:
      "Alphabet is the parent of Google. Revenue comes mainly from search and YouTube advertising, with additional businesses in cloud, Android, hardware, and other bets.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "AMZN",
    label: "AMZN",
    slug: "AMZN",
    summary:
      "Amazon runs e-commerce marketplaces, Amazon Web Services (AWS) cloud computing, advertising, and subscription services such as Prime and streaming video.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "META",
    label: "META",
    slug: "META",
    summary:
      "Meta Platforms operates Facebook, Instagram, WhatsApp, and Messenger. It monetizes social apps primarily through advertising and invests heavily in VR/AR and AI.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "TSLA",
    label: "TSLA",
    slug: "TSLA",
    summary:
      "Tesla designs and manufactures electric vehicles, energy storage, and solar products. It also develops autonomous driving software and operates a global Supercharger network.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "ORCL",
    label: "ORCL",
    slug: "ORCL",
    summary:
      "Oracle sells enterprise database software, cloud applications, and infrastructure. Customers include large corporations and governments that rely on its data platforms.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "ZM",
    label: "ZM",
    slug: "ZM",
    summary:
      "Zoom Video Communications provides video meetings, phone, webinars, and collaboration tools used by businesses, schools, and individuals worldwide.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "ADBE",
    label: "ADBE",
    slug: "ADBE",
    summary:
      "Adobe makes creative and document software such as Photoshop, Illustrator, Premiere, and Acrobat, plus Experience Cloud marketing and analytics products.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "NFLX",
    label: "NFLX",
    slug: "NFLX",
    summary:
      "Netflix is a global streaming entertainment service offering original and licensed TV series, films, and games on a subscription basis.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "CSCO",
    label: "CSCO",
    slug: "CSCO",
    summary:
      "Cisco designs networking hardware, security, collaboration, and cloud software that power corporate and internet infrastructure around the world.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "WDC",
    label: "WDC",
    slug: "WDC",
    summary:
      "Western Digital develops hard disk drives, flash memory, and data storage solutions for consumers, cloud providers, and enterprise customers.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "STX",
    label: "STX",
    slug: "STX",
    summary:
      "Seagate Technology manufactures hard drives and mass-storage systems used in PCs, data centers, and external consumer storage products.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "UBER",
    label: "UBER",
    slug: "UBER",
    summary:
      "Uber operates ride-hailing, delivery (Uber Eats), and freight platforms that connect consumers and businesses with drivers and couriers in cities worldwide.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "HPQ",
    label: "HPQ",
    slug: "HPQ",
    summary:
      "HP Inc. sells personal computers, printers, and related supplies and services to consumers and businesses under the HP brand.",
    source: "finnhub",
    kind: "stock",
  },
  {
    symbol: "NVDA",
    label: "NVDA",
    slug: "NVDA",
    summary:
      "NVIDIA designs GPUs and accelerated computing platforms used in gaming, data centers, AI training and inference, professional visualization, and automotive.",
    source: "finnhub",
    kind: "semiconductor",
  },
  {
    symbol: "MU",
    label: "MU",
    slug: "MU",
    summary:
      "Micron Technology manufactures DRAM and NAND memory chips sold into PCs, smartphones, data centers, automotive, and industrial devices.",
    source: "finnhub",
    kind: "semiconductor",
  },
  {
    symbol: "005930.KS",
    label: "Samsung",
    slug: "Samsung",
    summary:
      "Samsung Electronics is a South Korean conglomerate known for smartphones, TVs, appliances, and especially memory and logic semiconductors.",
    source: "yahoo",
    kind: "semiconductor",
  },
  {
    symbol: "000660.KS",
    label: "SK Hynix",
    slug: "SK-Hynix",
    summary:
      "SK hynix is a major South Korean maker of DRAM and NAND flash memory, supplying chips for smartphones, PCs, and data-center servers.",
    source: "yahoo",
    kind: "semiconductor",
  },
] as const;

export const INDEX_SYMBOLS = new Set(
  WATCHLIST.filter((w) => w.kind === "index").map((w) => w.symbol),
);

export const SEMICONDUCTOR_SYMBOLS = new Set(
  WATCHLIST.filter((w) => w.kind === "semiconductor").map((w) => w.symbol),
);

export const CHART_RANGES: { id: ChartRange; label: string }[] = [
  { id: "1d", label: "1D" },
  { id: "5d", label: "5D" },
  { id: "1mo", label: "1M" },
  { id: "3mo", label: "3M" },
  { id: "6mo", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "5y", label: "5Y" },
  { id: "10y", label: "10Y" },
  { id: "max", label: "MAX" },
];

const RANGE_INTERVAL: Record<ChartRange, string> = {
  "1d": "5m",
  "5d": "15m",
  "1mo": "1d",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1d",
  "5y": "1wk",
  "10y": "1wk",
  max: "1mo",
};

type FinnhubQuoteResponse = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
  error?: string;
};

type YahooChartResult = {
  meta?: {
    currency?: string;
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketOpen?: number;
    regularMarketTime?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: Array<number | null> }>;
    adjclose?: Array<{ adjclose?: Array<number | null> }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[];
    error?: { description?: string } | null;
  };
};

type IndexQuotesFile = {
  fetchedAt?: string;
  quotes?: StockQuote[];
};

const HISTORY_TTL_MS = 60 * 60 * 1000;
const historyCache = new Map<string, { at: number; closes: number[] }>();
const seriesCache = new Map<string, { at: number; series: ChartSeries }>();

export function getFinnhubKey(): string | undefined {
  const key = import.meta.env.VITE_FINNHUB_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : undefined;
}

export function findWatchItemBySlug(slug: string): WatchItem | undefined {
  const key = slug.trim().toLowerCase();
  return WATCHLIST.find((w) => w.slug.toLowerCase() === key);
}

export function findWatchItemBySymbol(symbol: string): WatchItem | undefined {
  return WATCHLIST.find((w) => w.symbol === symbol);
}

function yahooChartUrl(
  symbol: string,
  range: ChartRange | "5d" | "6mo" = "5d",
  interval?: string,
): string {
  const resolvedInterval = interval ?? (range === "5d" ? "1d" : "1d");
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${resolvedInterval}&range=${range}`;
  // Dev: Vite proxies /yahoo-api → query1.finance.yahoo.com (avoids CORS).
  if (import.meta.env.DEV) {
    return `/yahoo-api${path}`;
  }
  return `https://query1.finance.yahoo.com${path}`;
}

function closesFromYahooResult(result: YahooChartResult | undefined): number[] {
  const adj = result?.indicators?.adjclose?.[0]?.adjclose;
  const raw = result?.indicators?.quote?.[0]?.close;
  const series = adj ?? raw ?? [];
  return series.filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
}

function pointsFromYahooResult(
  result: YahooChartResult | undefined,
): ChartPoint[] {
  const timestamps = result?.timestamp ?? [];
  const adj = result?.indicators?.adjclose?.[0]?.adjclose;
  const raw = result?.indicators?.quote?.[0]?.close;
  const closes = adj ?? raw ?? [];
  const points: ChartPoint[] = [];
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

function quoteFromYahooMeta(
  item: WatchItem,
  meta: YahooChartResult["meta"],
): StockQuote {
  if (!meta?.regularMarketPrice && meta?.regularMarketPrice !== 0) {
    throw new Error(`No Yahoo price for ${item.label}`);
  }
  const price = meta.regularMarketPrice!;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - previousClose;
  const percentChange = previousClose ? (change / previousClose) * 100 : 0;
  return {
    symbol: item.symbol,
    label: item.label,
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

async function getYahooQuoteLive(item: WatchItem): Promise<StockQuote> {
  const res = await fetch(yahooChartUrl(item.symbol, "5d", "1d"));
  if (!res.ok) {
    throw new Error(`Yahoo quote failed for ${item.label} (${res.status})`);
  }
  const data = (await res.json()) as YahooChartResponse;
  if (data.chart?.error?.description) {
    throw new Error(`${item.label}: ${data.chart.error.description}`);
  }
  const meta = data.chart?.result?.[0]?.meta;
  return quoteFromYahooMeta(item, meta);
}

let cachedIndexFile: IndexQuotesFile | null | undefined;

async function getYahooQuoteCached(item: WatchItem): Promise<StockQuote> {
  if (cachedIndexFile === undefined) {
    try {
      const quotesPath = /\/stocks\/[^/]+\.html$/i.test(window.location.pathname)
        ? "../index-quotes.json"
        : "./index-quotes.json";
      const res = await fetch(quotesPath);
      cachedIndexFile = res.ok ? ((await res.json()) as IndexQuotesFile) : null;
    } catch {
      cachedIndexFile = null;
    }
  }
  const hit = cachedIndexFile?.quotes?.find((q) => q.symbol === item.symbol);
  if (!hit) {
    throw new Error(`No cached Yahoo quote for ${item.label}`);
  }
  return { ...hit, label: item.label };
}

export async function getYahooQuote(item: WatchItem): Promise<StockQuote> {
  // Browsers on GitHub Pages cannot call Yahoo (CORS). Prefer the build-time cache.
  if (!import.meta.env.DEV) {
    try {
      return await getYahooQuoteCached(item);
    } catch {
      return getYahooQuoteLive(item);
    }
  }
  try {
    return await getYahooQuoteLive(item);
  } catch {
    return getYahooQuoteCached(item);
  }
}

async function fetchYahooHistory(symbol: string): Promise<number[]> {
  const res = await fetch(yahooChartUrl(symbol, "6mo", "1d"));
  if (!res.ok) {
    throw new Error(`Yahoo history failed for ${symbol} (${res.status})`);
  }
  const data = (await res.json()) as YahooChartResponse;
  if (data.chart?.error?.description) {
    throw new Error(data.chart.error.description);
  }
  const closes = closesFromYahooResult(data.chart?.result?.[0]);
  if (closes.length < 2) {
    throw new Error(`Not enough history for ${symbol}`);
  }
  return closes;
}

export async function getYahooHistory(symbol: string): Promise<number[]> {
  const cached = historyCache.get(symbol);
  if (cached && Date.now() - cached.at < HISTORY_TTL_MS) {
    return cached.closes;
  }
  const closes = await fetchYahooHistory(symbol);
  historyCache.set(symbol, { at: Date.now(), closes });
  return closes;
}

export async function getChartSeries(
  symbol: string,
  range: ChartRange,
): Promise<ChartSeries> {
  const cacheKey = `${symbol}|${range}`;
  const cached = seriesCache.get(cacheKey);
  if (cached && Date.now() - cached.at < HISTORY_TTL_MS) {
    return cached.series;
  }

  const interval = RANGE_INTERVAL[range];
  const res = await fetch(yahooChartUrl(symbol, range, interval));
  if (!res.ok) {
    throw new Error(`Chart failed for ${symbol} (${res.status})`);
  }
  const data = (await res.json()) as YahooChartResponse;
  if (data.chart?.error?.description) {
    throw new Error(data.chart.error.description);
  }
  const result = data.chart?.result?.[0];
  const points = pointsFromYahooResult(result);
  if (points.length < 2) {
    throw new Error(`Not enough chart data for ${symbol}`);
  }
  const series: ChartSeries = {
    points,
    currency: result?.meta?.currency ?? "USD",
  };
  seriesCache.set(cacheKey, { at: Date.now(), series });
  return series;
}

export async function getFinnhubQuote(
  item: WatchItem,
  token = getFinnhubKey(),
): Promise<StockQuote> {
  if (!token) {
    throw new Error("Missing VITE_FINNHUB_KEY — add it to .env");
  }

  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", item.symbol);
  url.searchParams.set("token", token);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Quote failed for ${item.label} (${res.status})`);
  }

  const data = (await res.json()) as FinnhubQuoteResponse;
  if (data.error) {
    throw new Error(`${item.label}: ${data.error}`);
  }
  if (!data.c && data.c !== 0) {
    throw new Error(`No quote data for ${item.label}`);
  }

  return {
    symbol: item.symbol,
    label: item.label,
    price: data.c,
    change: data.d ?? 0,
    percentChange: data.dp ?? 0,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: data.t,
  };
}

export async function getQuote(
  item: WatchItem,
  token = getFinnhubKey(),
): Promise<StockQuote> {
  if (item.source === "yahoo") {
    return getYahooQuote(item);
  }
  return getFinnhubQuote(item, token);
}

export async function getWatchlistQuotes(
  items: readonly WatchItem[] = WATCHLIST,
): Promise<StockQuote[]> {
  const token = getFinnhubKey();
  // Without Finnhub, still show Yahoo-backed index quotes from the build snapshot.
  const loadable = token
    ? items
    : items.filter((item) => item.source === "yahoo");
  if (loadable.length === 0) {
    throw new Error(
      "Missing VITE_FINNHUB_KEY — add it to .env (and GitHub Actions secrets)",
    );
  }

  // Skip Yahoo history in production — CORS blocks it and it only powers sparklines.
  const [quoteResults, historyResults] = await Promise.all([
    Promise.allSettled(loadable.map((item) => getQuote(item, token))),
    import.meta.env.DEV
      ? Promise.allSettled(loadable.map((item) => getYahooHistory(item.symbol)))
      : Promise.resolve(
          loadable.map(
            () =>
              ({ status: "rejected", reason: "skip" }) as PromiseRejectedResult,
          ),
        ),
  ]);

  const quotes: StockQuote[] = [];
  const failures: string[] = [];

  for (let i = 0; i < quoteResults.length; i++) {
    const result = quoteResults[i];
    const item = loadable[i];
    if (result?.status === "fulfilled") {
      const hist = historyResults[i];
      const history = hist?.status === "fulfilled" ? hist.value : undefined;
      quotes.push({ ...result.value, history });
    } else if (item) {
      failures.push(item.label);
    }
  }

  if (quotes.length === 0) {
    throw new Error(
      failures.length
        ? `Could not load quotes (${failures.join(", ")})`
        : "Could not load quotes",
    );
  }

  return quotes;
}

export function currencyForSymbol(symbol: string): string {
  if (/\.(KS|KQ)$/i.test(symbol)) return "KRW";
  return "USD";
}

function usesWholeCurrency(currency: string): boolean {
  return currency === "KRW" || currency === "JPY";
}

export function formatPrice(n: number, currency = "USD"): string {
  const whole = usesWholeCurrency(currency);
  try {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    });
  } catch {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    });
  }
}

export function formatChange(n: number, currency = "USD"): string {
  const sign = n > 0 ? "+" : "";
  if (usesWholeCurrency(currency)) {
    return `${sign}${Math.round(n).toLocaleString("en-US")}`;
  }
  return `${sign}${n.toFixed(2)}`;
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

/** Tiny SVG polyline for ~6-month closes. */
export function sparklineSvg(values: number[] | undefined): string {
  if (!values || values.length < 2) {
    return `<span class="sparkline sparkline-empty" aria-hidden="true"></span>`;
  }

  const maxPoints = 48;
  const step = Math.max(1, Math.ceil(values.length / maxPoints));
  const sampled = values.filter((_, i) => i % step === 0);
  if (sampled[sampled.length - 1] !== values[values.length - 1]) {
    sampled.push(values[values.length - 1]!);
  }

  const w = 56;
  const h = 24;
  const pad = 2;
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  const points = sampled
    .map((v, i) => {
      const x = pad + (i / (sampled.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const first = sampled[0]!;
  const last = sampled[sampled.length - 1]!;
  const cls = last > first ? "up" : last < first ? "down" : "flat";

  return `<svg class="sparkline ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false"><polyline fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" points="${points}"/></svg>`;
}
