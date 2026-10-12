import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_EMBEDDING_MODEL = "liquid/lfm-2.5-embedding-350m:free";
const EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

export type MovieData = { title: string; description: string };
export type Movie = MovieData & { embedding: number[] };
export type MovieMatch = { title: string; description: string; match: number };

export class MovieNotFoundError extends Error {
  constructor(title: string) {
    super(`Movie not found: ${title}`);
    this.name = "MovieNotFoundError";
  }
}

export type Embedder = (inputs: string[]) => Promise<number[][]>;

export interface MovieService {
  initialize(): Promise<void>;
  search(query: string, limit?: number): Promise<MovieMatch[]>;
  similarMovies(title: string, limit?: number): MovieMatch[];
}

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
      return json.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    }
    throw new Error("Embeddings request failed after retries");
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function createMovieService({
  embed = createOpenRouterEmbedder(),
  moviesPath = process.env.MOVIES_PATH ||
    path.join(process.cwd(), "data", "movies.json"),
  batchSize = 50,
}: { embed?: Embedder; moviesPath?: string; batchSize?: number } = {}): MovieService {
  const movies: Movie[] = [];

  const topMatches = (matches: MovieMatch[], limit: number) =>
    matches.sort((a, b) => b.match - a.match).slice(0, limit);

  return {
    async initialize() {
      const raw = await readFile(moviesPath, "utf-8");
      const movieDataList = JSON.parse(raw) as MovieData[];

      // Embed in batches (free tier rate limits)
      for (let start = 0; start < movieDataList.length; start += batchSize) {
        const batch = movieDataList.slice(start, start + batchSize);
        const embeddings = await embed(batch.map((m) => m.description));

        batch.forEach((m, i) => {
          movies.push({
            title: m.title,
            description: m.description,
            embedding: embeddings[i],
          });
        });
      }
      console.log(`${movies.length} movies loaded with embeddings.`);
    },

    async search(query, limit = 3) {
      const [queryEmbedding] = await embed([query]);
      const matches = movies.map((movie) => ({
        title: movie.title,
        description: movie.description,
        match: cosineSimilarity(queryEmbedding, movie.embedding),
      }));
      return topMatches(matches, limit);
    },

    similarMovies(title, limit = 3) {
      const selected = movies.find(
        (m) => m.title.toLowerCase() === title.toLowerCase(),
      );
      if (!selected) throw new MovieNotFoundError(title);

      const matches = movies
        .filter((m) => m.title.toLowerCase() !== title.toLowerCase())
        .map((movie) => ({
          title: movie.title,
          description: movie.description,
          match: cosineSimilarity(selected.embedding, movie.embedding),
        }));
      return topMatches(matches, limit);
    },
  };
}