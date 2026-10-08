import "dotenv/config";

import { createApp } from "./app";
import { createSummarizeService } from "./chatService";


async function main() {
  const port = process.env.PORT || 8080;

  const app = createApp({
    summarizeService: createSummarizeService(),
   
  });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});