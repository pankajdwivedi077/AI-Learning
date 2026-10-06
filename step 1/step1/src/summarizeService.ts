import { OpenRouter } from "@openrouter/sdk";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

export interface SummarizeService {
  summarize(ticket: string): Promise<string>;
}

export function createSummarizeService({
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: { client?: OpenRouter; model?: string } = {}): SummarizeService {
  return {
    async summarize(ticket: string): Promise<string> {
      const response = await client.chat.send({
        chatRequest: {
          model,
          stream: false,
          maxTokens: 300,
          messages: [
            {
              role: "system",
              content:
                "You summarize customer support tickets in 2-3 short sentences. Include the problem and any requested action.",
            },
            { role: "user", content: ticket },
          ],
        },
      });

      // Narrow the union: a stream has no `choices`
      if (!("choices" in response)) {
        throw new Error("Expected a non-streaming response");
      }

      const content = response.choices[0]?.message?.content;

      if (typeof content !== "string" || !content.trim()) {
        throw new Error("The model returned an empty summary");
      }

      return content;
    },
  };
}