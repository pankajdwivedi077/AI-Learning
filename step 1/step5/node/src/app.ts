import express, { type Request, type Response } from "express";
import cors from "cors";
import type { SummarizeService } from "./chatService";

export function createApp(services: { summarizeService: SummarizeService }) {
  const { summarizeService } = services;

  if (!summarizeService?.chat) throw new TypeError("A chat service is required");

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

  return app;
}