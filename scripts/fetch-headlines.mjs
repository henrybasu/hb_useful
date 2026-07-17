import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/headlines.json");
const BLOCKLIST_PATH = resolve(ROOT, "src/data/news-blocked-sources.json");
const MAX = 24;
const PRIORITY_CATEGORIES = ["business", "nation", "world"];

const BLOCKED_SOURCE_NEEDLES = JSON.parse(
  readFileSync(BLOCKLIST_PATH, "utf8"),
).map((s) => String(s).toLowerCase().trim());

const SOFT_NEWS_RE =
  /\b(nfl|nba|mlb|nhl|ncaa|espn|ufc|mma|wwe|premier league|world cup|super bowl|world series|playoffs?|touchdown|home run|box score|olympics?|tennis|golf|soccer|basketball|baseball|hockey|grammys?|oscars?|emmys?|tony awards?|box office|netflix|hulu|disney\+|celebrity|celebrities|reality (tv|show)|season finale|trailer|eminem|kardashian|tmz|entertainment weekly|sports illustrated)\b/i;

function loadEnvFile() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function getGNewsKey() {
  const key = process.env.GNEWS_KEY || process.env.VITE_GNEWS_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : undefined;
}

function formatGNewsError(data) {
  if (!data) return "";
  if (typeof data.errors === "string") return data.errors;
  if (Array.isArray(data.errors)) return data.errors.join(", ");
  return data.message ?? "";
}

async function fetchCategoryHeadlines(category, max, token) {
  const url = new URL("https://gnews.io/api/v4/top-headlines");
  url.searchParams.set("category", category);
  url.searchParams.set("lang", "en");
  url.searchParams.set("country", "us");
  url.searchParams.set("max", String(max));
  url.searchParams.set("apikey", token);

  const res = await fetch(url);
  let data;
  try {
    data = await res.json();
  } catch {
    data = undefined;
  }

  if (!res.ok) {
    const detail = formatGNewsError(data);
    if (res.status === 403) {
      throw new Error(
        detail ||
          `${category}: GNews 403 — quota or plan restriction`,
      );
    }
    if (res.status === 401) {
      throw new Error(detail || `${category}: GNews 401 — invalid API key`);
    }
    throw new Error(detail || `${category}: Headlines failed (${res.status})`);
  }

  if (data?.errors || data?.message) {
    throw new Error(formatGNewsError(data) || `${category}: Headlines API error`);
  }

  return (data?.articles ?? [])
    .filter((a) => a.title && a.url)
    .map((a) => ({
      title: a.title,
      description: a.description ?? "",
      url: a.url,
      image: a.image ?? null,
      publishedAt: a.publishedAt ?? "",
      source: a.source?.name ?? "Unknown",
    }));
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeHeadlines(headlines) {
  const seen = new Set();
  const out = [];
  for (const h of headlines) {
    const key = normalizeTitle(h.title);
    if (seen.has(key) || seen.has(h.url)) continue;
    seen.add(key);
    seen.add(h.url);
    out.push(h);
  }
  return out;
}

function isSoftNews(h) {
  const text = `${h.title} ${h.description} ${h.source}`;
  return SOFT_NEWS_RE.test(text);
}

function isBlockedSource(h) {
  const source = (h.source ?? "").toLowerCase();
  const url = (h.url ?? "").toLowerCase();
  return BLOCKED_SOURCE_NEEDLES.some(
    (needle) =>
      needle.length > 0 && (source.includes(needle) || url.includes(needle)),
  );
}

function scoreHeadline(h) {
  const text = `${h.title} ${h.description}`.toLowerCase();
  let score = 0;
  if (
    /\b(congress|senate|white house|president|election|politic|democrat|republican|governor|supreme court|legislation)\b/.test(
      text,
    )
  ) {
    score += 3;
  }
  if (
    /\b(war|ukraine|china|israel|gaza|nato|united nations|diplomat|sanction|ceasefire)\b/.test(
      text,
    )
  ) {
    score += 3;
  }
  if (
    /\b(fed|inflation|economy|markets?|stocks?|gdp|tariff|trade|earnings|bank|recession|jobs report)\b/.test(
      text,
    )
  ) {
    score += 2;
  }
  return score;
}

function rankHeadlines(headlines) {
  return [...headlines].sort((a, b) => scoreHeadline(b) - scoreHeadline(a));
}

const token = getGNewsKey();
const errors = [];
const batches = [];

if (!token) {
  errors.push("Missing GNEWS_KEY (or VITE_GNEWS_KEY) — add it to .env");
  console.error(errors[0]);
  // In CI without secrets, keep the committed snapshot so the site can still build.
  if (existsSync(OUT)) {
    console.log(`keeping existing ${OUT} (no API key)`);
    process.exit(0);
  }
} else {
  const perCategory = Math.min(10, Math.max(3, MAX));
  // Sequential with a short pause to stay under GNews free-tier burst limits.
  for (let i = 0; i < PRIORITY_CATEGORIES.length; i++) {
    const category = PRIORITY_CATEGORIES[i];
    try {
      const articles = await fetchCategoryHeadlines(category, perCategory, token);
      batches.push(articles);
      console.log(`ok ${category} (${articles.length})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.error(`fail ${msg}`);
    }
    if (i < PRIORITY_CATEGORIES.length - 1) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
}

const merged = dedupeHeadlines(batches.flat()).filter((h) => !isBlockedSource(h));
const hardNews = merged.filter((h) => !isSoftNews(h));
const pool = hardNews.length > 0 ? hardNews : merged;
const headlines = rankHeadlines(pool).slice(0, MAX);

const payload = {
  fetchedAt: new Date().toISOString(),
  headlines,
  errors,
};

writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`wrote ${OUT} (${headlines.length} headlines)`);

if (headlines.length === 0) {
  process.exitCode = 1;
}
