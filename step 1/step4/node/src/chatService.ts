import { OpenRouter } from "@openrouter/sdk";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

const SYSTEM_PROMPT = "You are a funny AI chatbot. You reply everything sarcastically.";

type ChatMessage = { role: "user" | "assistant"; content: string };

export interface SummarizeService {
  chat(message: string): Promise<string>;
  chatStream(message: string): AsyncGenerator<string, void, void>;
}

export function createSummarizeService({
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: { client?: OpenRouter; model?: string } = {}): SummarizeService {
  const history: ChatMessage[] = [];

  const buildMessages = () => [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history,
  ];

  return {
    async chat(message) {
      history.push({ role: "user", content: message });
      try {
        const result = await client.chat.send({
          chatRequest: {
            model,
            messages: buildMessages(),
            stream: false,
          },
        });

        // Narrow the union: a non-streaming response has `choices`
        if (!("choices" in result)) {
          throw new Error("Expected a non-streaming response");
        }

        const content = result.choices[0]?.message?.content;
        const output = typeof content === "string" ? content : "";
        history.push({ role: "assistant", content: output });
        return output;
      } catch (error) {
        history.pop();
        throw error;
      }
    },

    async *chatStream(message) {
      history.push({ role: "user", content: message });
      let fullResponse = "";
      try {
        const stream = await client.chat.send({
          chatRequest: {
            model,
            messages: buildMessages(),
            stream: true,
          },
        });

        // Narrow the union: a full response has `choices`, a stream doesn't
        if ("choices" in stream) {
          throw new Error("Expected a streaming response");
        }

        for await (const chunk of stream) {
          const token = chunk.choices?.[0]?.delta?.content;
          if (typeof token === "string" && token) {
            fullResponse += token;
            yield token;
          }
        }

        history.push({ role: "assistant", content: fullResponse });
      } catch (error) {
        history.pop();
        throw error;
      }
    },
  };
}