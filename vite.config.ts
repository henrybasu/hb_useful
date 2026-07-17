import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

function stockPageInputs() {
  const dir = join(root, "stocks");
  try {
    return Object.fromEntries(
      readdirSync(dir)
        .filter((f) => f.endsWith(".html"))
        .map((f) => {
          const name = f.replace(/\.html$/i, "");
          return [`stock-${name}`, resolve(dir, f)];
        }),
    );
  } catch {
    return {};
  }
}

export default defineConfig({
  base: "./",
  server: {
    proxy: {
      "/yahoo-api": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yahoo-api/, ""),
        headers: {
          "User-Agent": "Mozilla/5.0 hb-useful-dev",
        },
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        weather: resolve(root, "weather.html"),
        stocks: resolve(root, "stocks.html"),
        news: resolve(root, "news.html"),
        ...stockPageInputs(),
      },
    },
  },
});
