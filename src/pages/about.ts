import "../styles/shared.css";
import "../styles/about.css";
import { renderSiteNav } from "../lib/nav";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app missing");

root.innerHTML = `
  ${renderSiteNav("about")}
  <main class="page-shell about-page">
    <p class="page-kicker">About</p>
    <h1 class="page-title">hb_useful</h1>
    <p class="page-lead">
      A small personal dashboard that gathers the day’s useful signals in one place:
      local weather, a stock watchlist, and skim-friendly headlines.
    </p>

    <section class="about-section" aria-labelledby="built-heading">
      <h2 id="built-heading">How it’s built</h2>
      <p>
        Static pages with TypeScript and Vite — no backend of its own.
      </p>
    </section>

    <section class="about-section" aria-labelledby="sources-heading">
      <h2 id="sources-heading">Sources</h2>
      <ul class="about-list">
        <li>
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
          — weather forecast and geocoding
        </li>
        <li>
          <a href="https://www.windy.com/" target="_blank" rel="noopener noreferrer">Windy.com</a>
          — interactive weather map embed
        </li>
        <li>
          <a href="https://finnhub.io/" target="_blank" rel="noopener noreferrer">Finnhub</a>
          — live stock quotes
        </li>
        <li>
          <a href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a>
          — index quotes and chart history
        </li>
        <li>
          <a href="https://gnews.io/" target="_blank" rel="noopener noreferrer">GNews</a>
          — compiles headlines from other news sites
        </li>
      </ul>
    </section>
  </main>
`;
