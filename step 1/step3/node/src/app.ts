import express, { type Request, type Response } from "express";
import cors from "cors";
import type { SummarizeService } from "./summarizeService";
import type { WebsiteBuilderService } from "./websiteBuilderService";

export function createApp(services: {
  summarizeService: SummarizeService;
  websiteBuilderService: WebsiteBuilderService;
}) {
  const { summarizeService, websiteBuilderService } = services;

  if (!summarizeService?.chat) throw new TypeError("A chat service is required");
  if (!websiteBuilderService?.generate) {
    throw new TypeError("A website builder service is required");
  }

  const app = express();
  app.use(cors({ origin: "*" })); // must come before the body parser
  app.use(express.text({ type: "*/*", limit: "100kb" }));

  const handle =
    (run: (message: string) => Promise<string>, label: string) =>
    async (request: Request, response: Response) => {
      const message = typeof request.body === "string" ? request.body : "";

      if (!message.trim()) {
        return response.status(400).type("text/plain").send("Message text is required.");
      }

      try {
        const reply = await run(message);
        return response.type("text/plain").send(reply);
      } catch (error) {
        console.error(`Failed to ${label}:`, error);
        return response.status(500).type("text/plain").send("Unable to process your message.");
      }
    };

  // SummarizeController
  app.post("/api/chat", handle((m) => summarizeService.chat(m), "get chat reply"));

  // WebsiteBuilderController
  app.post("/website", handle((m) => websiteBuilderService.generate(m), "generate website"));

  return app;
}