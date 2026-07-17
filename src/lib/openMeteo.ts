/** Open-Meteo forecast + geocoding client (no API key). */

export type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

export type DailyForecast = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProb: number;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  weatherCode: number;
  precipProb: number;
  isDay: boolean;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection?: number;
  windGusts?: number;
  humidity: number;
  feelsLike?: number;
  precipitation?: number;
  cloudCover?: number;
  pressure?: number;
  isDay: boolean;
};

export type ForecastBundle = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
};

type ForecastApiResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    relative_humidity_2m: number;
    apparent_temperature?: number;
    precipitation?: number;
    cloud_cover?: number;
    pressure_msl?: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

type GeocodeApiResponse = {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchCity(name: string, limit = 5): Promise<GeoResult[]> {
  const q = name.trim();
  if (!q) return [];

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", q);
  url.searchParams.set("count", String(limit));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }

  const data = (await res.json()) as GeocodeApiResponse;
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
    timezone: r.timezone,
  }));
}

export async function getForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastBundle> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "cloud_cover",
      "precipitation",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,precipitation_probability,is_day",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) {
    throw new Error(`Forecast failed (${res.status})`);
  }

  const data = (await res.json()) as ForecastApiResponse;
  const startIdx = Math.max(
    0,
    data.hourly.time.findIndex((t) => t >= data.current.time),
  );
  const hourly: HourlyForecast[] = data.hourly.time
    .slice(startIdx, startIdx + 24)
    .map((time, i) => {
      const idx = startIdx + i;
      return {
        time,
        temperature: data.hourly.temperature_2m[idx] ?? 0,
        weatherCode: data.hourly.weather_code[idx] ?? 0,
        precipProb: data.hourly.precipitation_probability[idx] ?? 0,
        isDay: data.hourly.is_day[idx] === 1,
      };
    });

  const daily: DailyForecast[] = data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i] ?? 0,
    tempMax: data.daily.temperature_2m_max[i] ?? 0,
    tempMin: data.daily.temperature_2m_min[i] ?? 0,
    precipProb: data.daily.precipitation_probability_max[i] ?? 0,
  }));

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      humidity: data.current.relative_humidity_2m,
      feelsLike: data.current.apparent_temperature,
      precipitation: data.current.precipitation,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      isDay: data.current.is_day === 1,
    },
    hourly,
    daily,
  };
}

export function formatPlace(geo: Pick<GeoResult, "name" | "admin1" | "country">): string {
  const parts = [geo.name];
  if (geo.admin1) parts.push(geo.admin1);
  if (geo.country) parts.push(geo.country);
  return parts.join(", ");
}

/** Windy embed: regional weather map (temp overlay) around a city. */
export function weatherMapEmbedUrl(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(3);
  const lon = longitude.toFixed(3);
  const params = new URLSearchParams({
    lat,
    lon,
    detailLat: lat,
    detailLon: lon,
    zoom: "8",
    level: "surface",
    overlay: "temp",
    product: "ecmwf",
    menu: "",
    message: "true",
    marker: "true",
    calendar: "now",
    pressure: "",
    type: "map",
    location: "coordinates",
    detail: "",
    metricWind: "mph",
    metricTemp: "°F",
    metricRain: "in",
    radarRange: "-1",
  });
  return `https://embed.windy.com/embed2.html?${params}`;
}

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

export function windCompass(degrees: number): string {
  const idx = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS[idx] ?? "N";
}
