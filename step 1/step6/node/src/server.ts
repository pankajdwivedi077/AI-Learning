import "dotenv/config";

import { createApp } from "./app";
import { createChatbotService } from "./chatbotservice";
import { createKnowledgeBase } from "./knowledgebase";

async function main() {
  const port = process.env.PORT || 8080;

  const knowledgeBase = createKnowledgeBase();

  // Pinecone is persistent, so only load the PDFs when you ask for it:
  // set INGEST=true in .env for the first run (or after changing the PDFs).
  if (process.env.INGEST === "true") {
    await knowledgeBase.ingest();
  }

  const app = createApp({
    chatbotService: createChatbotService({ knowledgeBase }),
  });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});