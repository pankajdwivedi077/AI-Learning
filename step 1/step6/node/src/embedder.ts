const DEFAULT_EMBEDDING_MODEL = "liquid/lfm-2.5-embedding-350m:free";
const EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

export type Embedder = (inputs: string[]) => Promise<number[][]>;

// Calls OpenRouter's OpenAI-compatible embeddings endpoint
export function createOpenRouterEmbedder({
  apiKey = process.env.API_KEY,
  model = process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
}: { apiKey?: string; model?: string } = {}): Embedder {
  return async (inputs) => {
    if (!apiKey) throw new Error("API_KEY is not set");

    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetch(EMBEDDINGS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, input: inputs }),
      });

      // Free tier is rate limited: back off and retry
      if (res.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      if (!res.ok) {
        throw new Error(`Embeddings request failed (${res.status}): ${await res.text()}`);
      }

      const json = (await res.json()) as {
        data: { index: number; embedding: number[] }[];
      };
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    }
    throw new Error("Embeddings request failed after retries");
  };
}