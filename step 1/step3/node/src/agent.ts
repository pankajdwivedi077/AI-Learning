import type { OpenRouter } from "@openrouter/sdk";
import type { AiTool } from "./aitools/types";

export type ChatMessage = { role: "user" | "assistant"; content: string };

interface RunOptions {
  client: OpenRouter;
  model: string;
  systemPrompt: string;
  history: ChatMessage[];
  tools: AiTool[];
  maxTokens?: number;
  maxSteps?: number;
}

export async function runWithTools({
  client,
  model,
  systemPrompt,
  history,
  tools,
  maxTokens = 4000,
  maxSteps = 25,
}: RunOptions): Promise<string> {
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  const toolDefs = tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  // Tool messages live only for this request (same as the Java version,
  // which stored just the user/assistant messages in history).
  const messages: any[] = [{ role: "system", content: systemPrompt }, ...history];

  for (let step = 0; step < maxSteps; step++) {
    const response = await client.chat.send({
      chatRequest: {
        model,
        stream: false,
        maxTokens,
        messages,
        tools: toolDefs,
      },
    });

    if (!("choices" in response)) {
      throw new Error("Expected a non-streaming response");
    }

    const message: any = response.choices[0]?.message;
    const toolCalls: any[] = message?.toolCalls ?? [];

    // No tool calls → this is the final answer
    if (toolCalls.length === 0) {
      const content = message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("The model returned an empty reply");
      }
      return content;
    }

    messages.push({
      role: "assistant",
      content: message.content ?? "",
      toolCalls,
    });

    for (const call of toolCalls) {
      const tool = toolMap.get(call.function.name);
      let result: string;

      try {
        if (!tool) throw new Error(`Unknown tool: ${call.function.name}`);
        const args = JSON.parse(call.function.arguments || "{}");
        result = await tool.execute(args);
      } catch (e) {
        // Send errors back to the model so it can recover
        result = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      messages.push({ role: "tool", toolCallId: call.id, content: result });
    }
  }

  throw new Error("Tool-calling loop exceeded the maximum number of steps");
}