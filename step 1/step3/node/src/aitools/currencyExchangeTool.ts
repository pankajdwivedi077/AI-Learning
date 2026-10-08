import { defineTool } from "./types";

const BASE_URL = "https://api.frankfurter.dev";

export const currencyExchangeTool = defineTool<{ from: string; to: string }>({
  name: "getExchangeRate",
  description: "Gets the latest exchange rate between two currencies.",
  parameters: {
    type: "object",
    properties: {
      from: { type: "string", description: "Source currency code, for example USD" },
      to: { type: "string", description: "Target currency code, for example INR" },
    },
    required: ["from", "to"],
  },
  async execute({ from, to }) {
    console.log("Currency Exchange tool called");

    const url = `${BASE_URL}/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Exchange API failed: ${res.status}`);
    return await res.text();
  },
});