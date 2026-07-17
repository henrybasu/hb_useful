import "../styles/shared.css";
import "../styles/weather.css";
import {
  formatPlace,
  getForecast,
  searchCity,
  weatherMapEmbedUrl,
  windCompass,
  type ForecastBundle,
  type GeoResult,
} from "../lib/openMeteo";
import {
  hourLabel,
  roundTemp,
  weatherLook,
  weekdayShort,
} from "../lib/weatherCodes";
import { renderSiteNav } from "../lib/nav";
import { escapeHtml } from "../lib/escape";

/** Default: San Jose, CA — override via search or geolocation. */
const DEFAULT_PLACE: GeoResult = {
  id: 5392171,
  name: "San Jose",
  latitude: 37.3382,
  longitude: -121.8863,
  admin1: "California",
  country: "United States",
  timezone: "America/Los_Angeles",
};

type AppState =
  | { kind: "loading"; place: GeoResult }
  | { kind: "ready"; place: GeoResult; forecast: ForecastBundle }
  | { kind: "error"; place: GeoResult; message: string };

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("#app missing");
}
const app = root;

let state: AppState = { kind: "loading", place: DEFAULT_PLACE };
let statusText = "";
let statusError = false;
let busy = false;
/** Geocode hits shown in the search dropdown. */
let cityChoices: GeoResult[] = [];
let pendingQuery = "";
let suggestionsOpen = false;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchSeq = 0;

function buildTicker(place: GeoResult, forecast: ForecastBundle): string {
  const look = weatherLook(forecast.current.weatherCode);
  const days = forecast.daily
    .slice(0, 5)
    .map((d) => {
      const w = weatherLook(d.weatherCode);
      return `${weekdayShort(d.date, forecast.timezone)} ${w.short} ${roundTemp(d.tempMax)}°/${roundTemp(d.tempMin)}°`;
    })
    .join("  •  ");

  return [
    formatPlace(place).toUpperCase(),
    `NOW ${look.label} ${roundTemp(forecast.current.temperature)}°F`,
    `WIND ${roundTemp(forecast.current.windSpeed)} MPH`,
    `HUMIDITY ${roundTemp(forecast.current.humidity)}%`,
    days,
    "DATA VIA OPEN-METEO  •  STAY TUNED FOR UPDATES",
  ].join("   ★   ");
}

function renderHourStrip(forecast: ForecastBundle): string {
  return forecast.hourly
    .slice(0, 10)
    .map((h) => {
      const look = weatherLook(h.weatherCode);
      return `
        <div class="hour">
          <span class="hour-time">${escapeHtml(hourLabel(h.time, forecast.timezone))}</span>
          <span class="hour-icon" aria-hidden="true">${look.icon}</span>
          <span class="hour-temp">${roundTemp(h.temperature)}°</span>
          <span class="hour-precip">${roundTemp(h.precipProb)}%</span>
        </div>`;
    })
    .join("");
}

function renderDayStrip(forecast: ForecastBundle): string {
  return forecast.daily
    .map((d) => {
      const look = weatherLook(d.weatherCode);
      return `
        <div class="day">
          <span class="day-name">${escapeHtml(weekdayShort(d.date, forecast.timezone))}</span>
          <span class="day-icon" aria-hidden="true">${look.icon}</span>
          <span class="day-temps">
            <span class="day-hi">${roundTemp(d.tempMax)}°</span>
            <span class="day-lo"> / ${roundTemp(d.tempMin)}°</span>
          </span>
          <span class="day-precip">${roundTemp(d.precipProb)}% rain</span>
        </div>`;
    })
    .join("");
}

function metaItem(label: string, value: string): string {
  return `<span>${escapeHtml(label)} <strong>${escapeHtml(value)}</strong></span>`;
}

function renderMetaRow(forecast: ForecastBundle): string {
  const { current, daily } = forecast;
  const items: string[] = [];

  let wind = `${roundTemp(current.windSpeed)} mph`;
  if (current.windDirection != null) {
    wind = `${windCompass(current.windDirection)} ${wind}`;
  }
  items.push(metaItem("Wind", wind));

  if (current.windGusts != null) {
    items.push(metaItem("Gusts", `${roundTemp(current.windGusts)} mph`));
  }

  items.push(metaItem("Humidity", `${roundTemp(current.humidity)}%`));

  if (current.feelsLike != null) {
    items.push(metaItem("Feels like", `${roundTemp(current.feelsLike)}°`));
  }

  const today = daily[0];
  if (today) {
    items.push(
      metaItem("High / Low", `${roundTemp(today.tempMax)}° / ${roundTemp(today.tempMin)}°`),
    );
    items.push(metaItem("Rain chance", `${roundTemp(today.precipProb)}%`));
  }

  if (current.precipitation != null && current.precipitation > 0) {
    items.push(metaItem("Precip", `${current.precipitation.toFixed(2)} in`));
  }

  if (current.cloudCover != null) {
    items.push(metaItem("Clouds", `${roundTemp(current.cloudCover)}%`));
  }

  if (current.pressure != null) {
    items.push(metaItem("Pressure", `${roundTemp(current.pressure)} mb`));
  }

  items.push(`<span>${current.isDay ? "Daytime" : "Night"}</span>`);

  return items.join("");
}

function renderShell(inner: string, sky = "cloud"): void {
  app.innerHTML = `
    ${renderSiteNav("weather")}
    <div class="broadcast" data-sky="${sky}">
      <div class="scanlines" aria-hidden="true"></div>
      <div class="vignette" aria-hidden="true"></div>
      <header class="top-bar">
        <p class="place-line">${escapeHtml(formatPlace(state.place))}</p>
      </header>
      ${inner}
    </div>`;
}

function render(): void {
  if (state.kind === "loading") {
    renderShell(`
      <main class="stage">
        <p class="status-msg">ACQUIRING SIGNAL… STAND BY</p>
        ${searchFormHtml()}
      </main>
      <footer class="ticker">
        <span class="ticker-label">WX</span>
        <div class="ticker-track">
          <span class="ticker-text">PLEASE STAND BY — FETCHING LOCAL CONDITIONS</span>
        </div>
      </footer>`);
    bindControls();
    return;
  }

  if (state.kind === "error") {
    renderShell(`
      <main class="signal-lost">
        <div class="signal-bars" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <h2>SIGNAL LOST</h2>
        <p>PLEASE STAND BY</p>
        <p>${escapeHtml(state.message)}</p>
        ${searchFormHtml()}
        <p class="status-msg ${statusError ? "error" : ""}">${statusHtml()}</p>
      </main>
      <footer class="ticker">
        <span class="ticker-label">WX</span>
        <div class="ticker-track">
          <span class="ticker-text">TECHNICAL DIFFICULTIES — WE APOLOGIZE FOR THE INTERRUPTION — RETRY FROM THE CONTROL PANEL ABOVE</span>
        </div>
      </footer>`);
    bindControls();
    return;
  }

  const { place, forecast } = state;
  const look = weatherLook(forecast.current.weatherCode);
  const ticker = buildTicker(place, forecast);

  renderShell(
    `
    <main class="stage">
      <section class="hero-weather" aria-label="Current conditions">
        <div class="hero-copy">
          <h1 class="condition">${escapeHtml(look.label)}</h1>
          <div class="hero-row">
            <div class="temp-block">
              <span class="temp">${roundTemp(forecast.current.temperature)}</span>
              <span class="temp-unit">°F</span>
            </div>
            <div class="icon-stage" aria-hidden="true">
              <span class="weather-icon">${look.icon}</span>
            </div>
          </div>
          <div class="meta-row">
            ${renderMetaRow(forecast)}
          </div>
        </div>
        <div class="weather-map-wrap">
          <iframe
            class="weather-map"
            title="Weather map around ${escapeHtml(formatPlace(place))}"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allow="fullscreen"
            src="${weatherMapEmbedUrl(place.latitude, place.longitude)}"
          ></iframe>
        </div>
      </section>

      <div class="forecast-dock">
        <section class="hour-strip" aria-label="Hourly forecast">
          ${renderHourStrip(forecast)}
        </section>

        <section class="day-strip" aria-label="Seven day forecast">
          ${renderDayStrip(forecast)}
        </section>

        ${searchFormHtml()}
        <p class="status-msg ${statusError ? "error" : ""}" role="status">${statusHtml()}</p>
      </div>
    </main>
    <footer class="ticker">
      <span class="ticker-label">WX</span>
      <div class="ticker-track">
        <span class="ticker-text">${escapeHtml(ticker)}&nbsp;&nbsp;&nbsp;${escapeHtml(ticker)}</span>
      </div>
    </footer>`,
    look.sky,
  );
  bindControls();
}

function suggestionsHtml(): string {
  if (!suggestionsOpen || cityChoices.length === 0) return "";
  return cityChoices
    .map(
      (c) =>
        `<li role="option" class="city-suggestion" data-id="${c.id}" tabindex="-1">${escapeHtml(formatPlace(c))}</li>`,
    )
    .join("");
}

function statusHtml(): string {
  const source =
    !statusError && statusText.startsWith("Updated")
      ? ` · Source: <a class="source-link" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>, <a class="source-link" href="https://www.windy.com/" target="_blank" rel="noopener noreferrer">Windy.com</a>`
      : "";
  return `${escapeHtml(statusText)}${source}`;
}

function searchFormHtml(): string {
  const showList = suggestionsOpen && cityChoices.length > 0;
  return `
    <form class="controls" id="wx-form" autocomplete="off">
      <div class="search-field">
        <input
          type="search"
          name="city"
          id="city-input"
          placeholder="Search city…"
          aria-label="Search city"
          aria-autocomplete="list"
          aria-controls="city-suggestions"
          aria-expanded="${showList ? "true" : "false"}"
          value="${escapeHtml(pendingQuery)}"
          ${busy ? "disabled" : ""}
        />
        <ul
          id="city-suggestions"
          class="city-suggestions${showList ? " is-open" : ""}"
          role="listbox"
          aria-label="City suggestions"
          ${showList ? "" : "hidden"}
        >
          ${suggestionsHtml()}
        </ul>
      </div>
      <button type="submit" ${busy ? "disabled" : ""}>SEARCH</button>
    </form>`;
}

function patchSuggestions(): void {
  const input = document.querySelector<HTMLInputElement>("#city-input");
  const list = document.querySelector<HTMLUListElement>("#city-suggestions");
  if (!input || !list) return;

  const showList = suggestionsOpen && cityChoices.length > 0;
  input.setAttribute("aria-expanded", showList ? "true" : "false");
  list.classList.toggle("is-open", showList);
  list.hidden = !showList;
  list.innerHTML = suggestionsHtml();
}

function patchStatus(): void {
  const el = document.querySelector<HTMLParagraphElement>(".status-msg");
  if (!el) return;
  el.innerHTML = statusHtml();
  el.classList.toggle("error", statusError);
}

function closeSuggestions(): void {
  suggestionsOpen = false;
  patchSuggestions();
}

function dismissSearchUi(): void {
  closeSuggestions();
  if (!statusError && (statusText.startsWith("Found ") || statusText.startsWith("Searching for "))) {
    statusText = "";
    patchStatus();
  }
}

function bindControls(): void {
  const form = document.querySelector<HTMLFormElement>("#wx-form");
  const input = document.querySelector<HTMLInputElement>("#city-input");
  const list = document.querySelector<HTMLUListElement>("#city-suggestions");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (searchTimer) clearTimeout(searchTimer);
    void searchCities(input?.value ?? "", { fromSubmit: true });
  });

  input?.addEventListener("input", () => {
    pendingQuery = input.value;
    if (searchTimer) clearTimeout(searchTimer);

    const q = input.value.trim();
    if (q.length < 3) {
      cityChoices = [];
      suggestionsOpen = false;
      patchSuggestions();
      return;
    }

    searchTimer = setTimeout(() => {
      void searchCities(q, { fromTyping: true });
    }, 280);
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dismissSearchUi();
      return;
    }
    if (e.key === "ArrowDown" && suggestionsOpen && cityChoices.length > 0) {
      e.preventDefault();
      const first = list?.querySelector<HTMLElement>(".city-suggestion");
      first?.focus();
    }
  });

  list?.addEventListener("click", (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".city-suggestion");
    if (!item) return;
    const id = Number(item.dataset.id);
    const hit = cityChoices.find((c) => c.id === id);
    if (hit) {
      suggestionsOpen = false;
      cityChoices = [];
      void loadPlace(hit, `Tuning to ${formatPlace(hit)}…`);
    }
  });

  list?.addEventListener("keydown", (e) => {
    const items = [...list.querySelectorAll<HTMLElement>(".city-suggestion")];
    const current = document.activeElement as HTMLElement | null;
    const idx = current ? items.indexOf(current) : -1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(idx + 1, items.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx <= 0) input?.focus();
      else items[idx - 1]?.focus();
    } else if (e.key === "Enter" && current?.classList.contains("city-suggestion")) {
      e.preventDefault();
      current.click();
    } else if (e.key === "Escape") {
      dismissSearchUi();
      input?.focus();
    }
  });
}

document.addEventListener(
  "pointerdown",
  (e) => {
    const field = document.querySelector(".search-field");
    const form = document.querySelector("#wx-form");
    const target = e.target as Node;
    if (form?.contains(target)) return;
    if (!field) return;
    dismissSearchUi();
  },
  { capture: true },
);

async function loadPlace(place: GeoResult, note = ""): Promise<void> {
  busy = true;
  suggestionsOpen = false;
  cityChoices = [];
  statusText = note || `Tuning to ${formatPlace(place)}…`;
  statusError = false;
  state = { kind: "loading", place };
  render();

  try {
    const forecast = await getForecast(place.latitude, place.longitude);
    state = { kind: "ready", place, forecast };
    statusText = `Updated ${new Date().toLocaleTimeString()}`;
    statusError = false;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown transmission error";
    state = { kind: "error", place, message };
    statusText = message;
    statusError = true;
  } finally {
    busy = false;
    render();
  }
}

async function searchCities(
  query: string,
  opts: { fromTyping?: boolean; fromSubmit?: boolean } = {},
): Promise<void> {
  const q = query.trim();
  pendingQuery = q;

  if (opts.fromTyping && q.length < 3) {
    cityChoices = [];
    suggestionsOpen = false;
    patchSuggestions();
    return;
  }

  if (!q) {
    statusText = "Enter a city name, partner.";
    statusError = true;
    cityChoices = [];
    suggestionsOpen = false;
    if (opts.fromTyping) {
      patchStatus();
      patchSuggestions();
    } else {
      render();
    }
    return;
  }

  if (opts.fromSubmit && q.length < 3) {
    statusText = "Type at least 3 characters to search.";
    statusError = true;
    cityChoices = [];
    suggestionsOpen = false;
    patchStatus();
    patchSuggestions();
    return;
  }

  const seq = ++searchSeq;
  if (!opts.fromTyping) {
    busy = true;
    render();
  }

  statusText = `Searching for ${q}…`;
  statusError = false;
  if (opts.fromTyping) patchStatus();

  try {
    const results = await searchCity(q, 8);
    if (seq !== searchSeq) return;

    cityChoices = results;
    if (results.length === 0) {
      suggestionsOpen = false;
      statusText = `No match for “${q}”. Try another city.`;
      statusError = true;
    } else if (results.length === 1 && opts.fromSubmit) {
      suggestionsOpen = false;
      statusText = `Found ${formatPlace(results[0]!)} — locking on…`;
      statusError = false;
      busy = false;
      render();
      await loadPlace(results[0]!, `Tuning to ${formatPlace(results[0]!)}…`);
      return;
    } else {
      suggestionsOpen = true;
      statusText =
        results.length === 1
          ? `Found ${formatPlace(results[0]!)} — select it below.`
          : `Found ${results.length} places — pick one.`;
      statusError = false;
    }
  } catch (err) {
    if (seq !== searchSeq) return;
    cityChoices = [];
    suggestionsOpen = false;
    statusText = err instanceof Error ? err.message : "City search failed";
    statusError = true;
  } finally {
    if (seq !== searchSeq) return;
    busy = false;
    if (opts.fromTyping) {
      patchStatus();
      patchSuggestions();
    } else {
      render();
    }
  }
}

void loadPlace(DEFAULT_PLACE, "Coming to you live from San Jose…");
