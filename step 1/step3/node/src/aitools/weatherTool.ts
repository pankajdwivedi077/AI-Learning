import { defineTool } from "./types";

const BASE_URL = "https://api.weatherapi.com/v1";

export const weatherTool = defineTool<{ city: string }>({
  name: "currentWeather",
  description: "Get the current weather of a city.",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "Name of the city" },
    },
    required: ["city"],
  },
  async execute({ city }) {
    console.log("Weather tool called");

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) throw new Error("WEATHER_API_KEY is not configured");

    const url = new URL(`${BASE_URL}/current.json`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", city);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
    return await res.text();
  },
});