import { OpenRouter } from "@openrouter/sdk";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

const SYSTEM_PROMPT = `
You are a customer-support executive for our
Food ordering app named Tomato.

Your job is to identify the customer's main
problem and urgency. Answer them related to their query in 1 line.

Use professional language. If user has an issue,
use words like I understand your frustration,
I am really sorry for your trouble etc.

Do not answer any other question which is not
related to Ordering Food query, refund query,
order tracking status query or company policy query.
`.trim();

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface SummarizeService {
  chat(message: string): Promise<string>;
}

export function createSummarizeService({
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: { client?: OpenRouter; model?: string } = {}): SummarizeService {
  
  const history: ChatMessage[] = [];

  return {
    async chat(message: string): Promise<string> {
      history.push({ role: "user", content: message });

      try {
        const response = await client.chat.send({
          chatRequest: {
            model,
            stream: false,
            maxTokens: 300,
            messages: [
              { role: "system", content: SYSTEM_PROMPT }, 
              ...history,                                  
            ],
          },
        });

        if (!("choices" in response)) {
          throw new Error("Expected a non-streaming response");
        }

        const content = response.choices[0]?.message?.content;

        if (typeof content !== "string" || !content.trim()) {
          throw new Error("The model returned an empty reply");
        }

        history.push({ role: "assistant", content });
        return content;
      } catch (error) {
        history.pop(); 
        throw error;
      }
    },
  };
}