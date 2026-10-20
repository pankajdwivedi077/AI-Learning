import { OpenRouter } from "@openrouter/sdk";
import type { KnowledgeBase } from "./knowledgebase";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

export interface ChatbotService {
  answerUserQuery(question: string): Promise<string>;
}

export function createChatbotService({
  knowledgeBase,
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: {
  knowledgeBase: KnowledgeBase;
  client?: OpenRouter;
  model?: string;
}): ChatbotService {
  return {
    async answerUserQuery(question) {
      // 1. question -> vector, 2. similarity search, 3. top 4 chunks
      const chunks = await knowledgeBase.search(question, 4);
      const context = chunks.join("\n\n");

      const systemPrompt = `You are an AI customer support assistant for our e-commerce company.

Answer the customer using ONLY the company information provided below.

If the answer is not available in the provided information, say:
"I don't have that information in the company documents."

COMPANY INFORMATION
${context}`;

const result = await client.chat.send({
  chatRequest: {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    maxTokens: 500,
    stream: false,
  },
});

      if (!("choices" in result)) {
        throw new Error("Expected a non-streaming response");
      }
      const content = result.choices[0]?.message?.content;
      return typeof content === "string" ? content : "";
    },
  };
}