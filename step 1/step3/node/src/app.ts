import express from "express";
import cors from "cors";
import type { SummarizeService } from "./summarizeService";

export function createApp(summarizeService: SummarizeService) {
  if (!summarizeService?.chat) {
    throw new TypeError("A chat service is required");
  }

  const app = express();
  app.use(cors({ origin: "*" })); // must come before the body parser
  app.use(express.text({ type: "*/*", limit: "100kb" }));

  app.post("/api/chat", async (request, response) => {
    const message = typeof request.body === "string" ? request.body : "";

    if (!message.trim()) {
      return response
        .status(400)
        .type("text/plain")
        .send("Message text is required.");
    }

    try {
      const reply = await summarizeService.chat(message);
      return response.type("text/plain").send(reply);
    } catch (error) {
      console.error("Failed to get chat reply:", error);
      return response
        .status(500)
        .type("text/plain")
        .send("Unable to process your message.");
    }
  });

  return app;
}