/**
 * Generates identical Vite entry HTML files for each watchlist slug.
 * Slugs are parsed from src/lib/stocks.ts so pages stay in sync.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stocksDir = join(root, "stocks");
const stocksTs = readFileSync(join(root, "src/lib/stocks.ts"), "utf8");

const slugs = [...stocksTs.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
if (slugs.length === 0) {
  console.error("No stock slugs found in src/lib/stocks.ts");
  process.exit(1);
}

mkdirSync(stocksDir, { recursive: true });

for (const file of readdirSync(stocksDir)) {
  if (file.endsWith(".html")) {
    rmSync(join(stocksDir, file));
  }
}

const htmlFor = (slug) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Details and price chart for ${slug}." />
    <title>${slug} — Stocks — hb_useful</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script>
      (function () {
        try {
          var t = localStorage.getItem("hb-theme");
          if (t !== "dark" && t !== "light") {
            t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          }
          document.documentElement.setAttribute("data-theme", t);
        } catch (e) {}
      })();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/pages/stock-detail.ts"></script>
  </body>
</html>
`;

for (const slug of slugs) {
  writeFileSync(join(stocksDir, `${slug}.html`), htmlFor(slug));
}

console.log(`Generated ${slugs.length} stock detail pages in stocks/`);
