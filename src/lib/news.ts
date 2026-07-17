/** Headlines from build-time GNews snapshot (public/headlines.json). */

import blockedSources from "../data/news-blocked-sources.json";

export type Headline = {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: string;
};

type HeadlinesFile = {
  fetchedAt?: string;
  headlines?: Headline[];
  errors?: string[];
};

export type HeadlinesSnapshot = {
  fetchedAt: string;
  headlines: Headline[];
};

const BLOCKED_SOURCE_NEEDLES = (blockedSources as string[]).map((s) =>
  s.toLowerCase().trim(),
);

export function isBlockedSource(h: Pick<Headline, "source" | "url">): boolean {
  const source = h.source.toLowerCase();
  const url = h.url.toLowerCase();
  return BLOCKED_SOURCE_NEEDLES.some(
    (needle) =>
      needle.length > 0 && (source.includes(needle) || url.includes(needle)),
  );
}

let cachedFile: HeadlinesFile | null | undefined;

async function loadHeadlinesFile(): Promise<HeadlinesFile | null> {
  if (cachedFile !== undefined) return cachedFile;
  try {
    const res = await fetch("./headlines.json");
    cachedFile = res.ok ? ((await res.json()) as HeadlinesFile) : null;
  } catch {
    cachedFile = null;
  }
  return cachedFile;
}

export async function getTopHeadlines(max = 10): Promise<HeadlinesSnapshot> {
  const file = await loadHeadlinesFile();
  if (!file) {
    throw new Error(
      "Missing headlines.json — run npm run fetch-headlines with GNEWS_KEY in .env",
    );
  }

  const headlines = (file.headlines ?? [])
    .filter((h) => !isBlockedSource(h))
    .slice(0, Math.max(1, max));
  if (headlines.length === 0) {
    const detail = file.errors?.length ? `: ${file.errors.join("; ")}` : "";
    throw new Error(`No headlines in snapshot${detail}`);
  }

  return {
    fetchedAt: file.fetchedAt ?? "",
    headlines,
  };
}

export function formatHeadlineTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPaperDate(d = new Date()): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatWireAsOf(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
