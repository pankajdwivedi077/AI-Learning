import { OpenRouter } from "@openrouter/sdk";
import { runWithTools, type ChatMessage } from "./agent";
import { createWebsiteTools } from "./aitools/websiteTools";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

const SYSTEM_PROMPT = `
You are an expert frontend website developer.

Your job is to create complete static websites using the available tools.

Follow these rules:
1. Create a separate directory for every website.
2. Create index.html.
3. Create style.css.
4. Create script.js when JavaScript is useful.
5. Build modern, beautiful and responsive websites.
6. Use only HTML, CSS and vanilla JavaScript.
7. Do not just return website code in your response. Actually create the files using tools.
8. After creating the website, list the project files.
9. Read important files again if needed and fix obvious problems.
10. Finish only when the complete website has been created.
`.trim();

export interface WebsiteBuilderService {
  generate(message: string): Promise<string>;
}

export async function createWebsiteBuilderService({
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: { client?: OpenRouter; model?: string } = {}): Promise<WebsiteBuilderService> {
  const history: ChatMessage[] = [];
  const tools = await createWebsiteTools();

  return {
    async generate(message) {
      history.push({ role: "user", content: message });

      try {
        const output = await runWithTools({
          client,
          model,
          systemPrompt: SYSTEM_PROMPT,
          history,
          tools,
          maxTokens: 8000, // files can be large
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