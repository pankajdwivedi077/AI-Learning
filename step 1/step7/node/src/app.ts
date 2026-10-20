import express, { type Request, type Response } from "express";
import cors from "cors";
import type { MeetingService } from "./meetingservice";

export function createApp({ meetingService }: { meetingService: MeetingService }) {
  if (!meetingService?.schedule) {
    throw new TypeError("A meeting service is required");
  }

  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.json()); // handles application/json
  app.use(express.text()); // handles text/plain (Spring's raw String @RequestBody)

  // POST /api/schedule
  // Body: raw text "Meet John tomorrow at 3pm"  OR  JSON { "message": "..." }
  app.post("/api/schedule", async (request: Request, response: Response) => {
    const message =
      typeof request.body === "string" ? request.body : request.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return response.status(400).json({ error: "Request body message is required." });
    }

    try {
      const details = await meetingService.schedule(message);
      return response.json(details);
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
      return response.status(500).json({ error: "Unable to process your request." });
    }
  });

  return app;
}