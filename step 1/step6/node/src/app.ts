import express, { type Request, type Response } from "express";
import cors from "cors";
import type { SummarizeService } from "./chatService";
import { MovieNotFoundError, type MovieService } from "./movieService";

export function createApp(services: {
  summarizeService: SummarizeService;
  movieService: MovieService;
}) {
  const { summarizeService, movieService } = services;

  if (!summarizeService?.chat) throw new TypeError("A chat service is required");
  if (!movieService?.search) throw new TypeError("A movie service is required");

  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.text({ type: "*/*", limit: "100kb" }));

  const getMessage = (request: Request) =>
    typeof request.body === "string" ? request.body : "";

  // Non-streaming
  app.post("/api/chat", async (request: Request, response: Response) => {
    const message = getMessage(request);
    if (!message.trim()) {
      return response.status(400).type("text/plain").send("Message text is required.");
    }
    try {
      const reply = await summarizeService.chat(message);
      return response.type("text/plain").send(reply);
    } catch (error) {
      console.error("Failed to get chat reply:", error);
      return response.status(500).type("text/plain").send("Unable to process your message.");
    }
  });

  // Streaming
  app.post("/api/chat/stream", async (request: Request, response: Response) => {
    const message = getMessage(request);
    if (!message.trim()) {
      return response.status(400).type("text/plain").send("Message text is required.");
    }

    response.setHeader("Content-Type", "text/plain; charset=utf-8");

    try {
      for await (const token of summarizeService.chatStream(message)) {
        response.write(token);
      }
      response.end();
    } catch (error) {
      console.error("Failed to stream chat reply:", error);
      if (!response.headersSent) {
        response.status(500).type("text/plain").send("Unable to process your message.");
      } else {
        response.end();
      }
    }
  });

  // GET /api/movie/search?query=space adventure
  app.get("/api/movie/search", async (request: Request, response: Response) => {
    const query = request.query.query;
    if (typeof query !== "string" || !query.trim()) {
      return response.status(400).json({ error: "Query parameter 'query' is required." });
    }
    try {
      return response.json(await movieService.search(query));
    } catch (error) {
      console.error("Movie search failed:", error);
      return response.status(500).json({ error: "Unable to search movies." });
    }
  });

  // GET /api/movie/similar?title=Inception
  app.get("/api/movie/similar", (request: Request, response: Response) => {
    const title = request.query.title;
    if (typeof title !== "string" || !title.trim()) {
      return response.status(400).json({ error: "Query parameter 'title' is required." });
    }
    try {
      return response.json(movieService.similarMovies(title));
    } catch (error) {
      if (error instanceof MovieNotFoundError) {
        return response.status(404).json({ error: error.message });
      }
      console.error("Similar movies failed:", error);
      return response.status(500).json({ error: "Unable to find similar movies." });
    }
  });

  return app;
}