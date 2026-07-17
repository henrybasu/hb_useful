/** WMO weather interpretation codes → 90s broadcast labels + glyph icons. */

export type WeatherLook = {
  label: string;
  short: string;
  icon: string;
  sky: "clear" | "cloud" | "rain" | "snow" | "storm" | "fog";
};

const LOOKS: Record<string, WeatherLook> = {
  clear: { label: "SUNNY SKIES", short: "SUNNY", icon: "☀", sky: "clear" },
  mainlyClear: {
    label: "MOSTLY SUNNY",
    short: "MOSTLY SUN",
    icon: "☼",
    sky: "clear",
  },
  partlyCloudy: {
    label: "PARTLY CLOUDY",
    short: "PT CLOUDY",
    icon: "⛅",
    sky: "cloud",
  },
  overcast: { label: "OVERCAST", short: "CLOUDY", icon: "☁", sky: "cloud" },
  fog: { label: "FOGGY", short: "FOG", icon: "〰", sky: "fog" },
  drizzle: { label: "DRIZZLE", short: "DRIZZLE", icon: "☂", sky: "rain" },
  rain: { label: "RAIN", short: "RAIN", icon: "☂", sky: "rain" },
  heavyRain: {
    label: "HEAVY RAIN",
    short: "HVY RAIN",
    icon: "☔",
    sky: "rain",
  },
  snow: { label: "SNOW", short: "SNOW", icon: "❄", sky: "snow" },
  heavySnow: {
    label: "HEAVY SNOW",
    short: "HVY SNOW",
    icon: "❄",
    sky: "snow",
  },
  storm: {
    label: "THUNDERSTORM",
    short: "STORMS",
    icon: "⚡",
    sky: "storm",
  },
};

export function weatherLook(code: number): WeatherLook {
  if (code === 0) return LOOKS.clear;
  if (code === 1) return LOOKS.mainlyClear;
  if (code === 2) return LOOKS.partlyCloudy;
  if (code === 3) return LOOKS.overcast;
  if (code === 45 || code === 48) return LOOKS.fog;
  if (code >= 51 && code <= 57) return LOOKS.drizzle;
  if (code >= 61 && code <= 67) return LOOKS.rain;
  if (code >= 80 && code <= 82) return LOOKS.heavyRain;
  if (code >= 71 && code <= 77) return LOOKS.snow;
  if (code === 85 || code === 86) return LOOKS.heavySnow;
  if (code >= 95 && code <= 99) return LOOKS.storm;
  return LOOKS.partlyCloudy;
}

export function weekdayShort(isoDate: string, timeZone: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  })
    .format(d)
    .toUpperCase();
}

export function hourLabel(isoTime: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    timeZone,
  })
    .format(new Date(isoTime))
    .toUpperCase();
}

export function roundTemp(n: number): number {
  return Math.round(n);
}
