// agrosense/routes/api/weather.ts
import { Handlers } from "$fresh/server.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load .env variables
const env = await load();
const OPENWEATHERMAP_API_KEY = env["OPENWEATHERMAP_API_KEY"];
console.log("→ [weather] OPENWEATHERMAP_API_KEY =", OPENWEATHERMAP_API_KEY);


const OWM_BASE = "https://api.openweathermap.org/data/2.5/weather";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    // For now we only support direct coords; farmId lookup coming in a future step
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");
    const units = url.searchParams.get("units") ?? "metric";
    const lang = url.searchParams.get("lang") ?? "en";

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "Missing ‘lat’ or ‘lon’ query parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const weatherUrl =
      `${OWM_BASE}?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${OPENWEATHERMAP_API_KEY}`;

    try {
      const res = await fetch(weatherUrl);
      if (!res.ok) throw new Error(`OWM response ${res.status}`);
      const data = await res.json();

      const result = {
        location: {
          name: "Custom Location",  // swap in farm name when we add DB lookup
          lat: data.coord.lat,
          lon: data.coord.lon,
        },
        current: {
          timestamp: new Date(data.dt * 1000).toISOString(),
          temperature: data.main.temp,
          feels_like: data.main.feels_like,
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
          weather: {
            code: data.weather[0].id,
            icon: data.weather[0].icon,
            description: data.weather[0].description,
          },
        },
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Weather fetch error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve weather data" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
