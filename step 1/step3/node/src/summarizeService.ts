import { OpenRouter } from "@openrouter/sdk";
import { runWithTools, type ChatMessage } from "./agent";
import { calculatorTool } from "./aitools/calculatorTool";
import { weatherTool } from "./aitools/weatherTool";
import { currencyExchangeTool } from "./aitools/currencyExchangeTool";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

const SYSTEM_PROMPT = `
You are a helpful AI assistant with access to external tools.

Follow these rules:
1. For arithmetic calculations, ALWAYS use the calculator tool.
2. Always use calculator tool for even trivial calculation
3. For current weather, ALWAYS use the currentWeather tool.
4. For currency conversion or exchange rates, ALWAYS use the getExchangeRate tool.
5. You may call multiple tools when solving a multi-step request.
6. After receiving tool results, explain the answer naturally.
7. Never invent current weather or exchange-rate information.
`.trim();

export interface SummarizeService {
  chat(message: string): Promise<string>;
}

export function createSummarizeService({
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: { client?: OpenRouter; model?: string } = {}): SummarizeService {
  const history: ChatMessage[] = [];
  const tools = [calculatorTool, weatherTool, currencyExchangeTool];

  return {
    async chat(message) {
      history.push({ role: "user", content: message });

      try {
        const output = await runWithTools({
          client,
          model,
          systemPrompt: SYSTEM_PROMPT,
          history,
          tools,
        });
        history.push({ role: "assistant", content: output });
        return output;
      } catch (error) {
        history.pop();
        throw error;
      }
    },
  };
}