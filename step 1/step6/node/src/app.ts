import express, { type Request, type Response } from "express";
import cors from "cors";
import type { ChatbotService } from "./chatbotservice";

export function createApp({ chatbotService }: { chatbotService: ChatbotService }) {
  if (!chatbotService?.answerUserQuery) {
    throw new TypeError("A chatbot service is required");
  }

  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.json());

  // GET /api/chat/query?question=What is your return policy?
  app.get("/api/chat/query", async (request: Request, response: Response) => {
    const question = request.query.question;
    if (typeof question !== "string" || !question.trim()) {
      return response
        .status(400)
        .json({ error: "Query parameter 'question' is required." });
    }
    try {
      const answer = await chatbotService.answerUserQuery(question);
      return response.json({ answer });
    } catch (error) {
      console.error("Failed to answer question:", error);
      return response.status(500).json({ error: "Unable to process your question." });
    }
  });

  // POST /api/chat/query  with body { "question": "..." }
  app.post("/api/chat/query", async (request: Request, response: Response) => {
    const question = request.body?.question;
    if (typeof question !== "string" || !question.trim()) {
      return response.status(400).json({ error: "Field 'question' is required." });
    }
    try {
      const answer = await chatbotService.answerUserQuery(question);
      return response.json({ answer });
    } catch (error) {
      console.error("Failed to answer question:", error);
      return response.status(500).json({ error: "Unable to process your question." });
    }
  });

  return app;
}