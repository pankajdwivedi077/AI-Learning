import "dotenv/config";

import { createApp } from "./app"; 
import { createSummarizeService } from "./summarizeService";

const port = process.env.PORT || 8080;
const app = createApp(createSummarizeService());

app.listen(port, () => {
  console.log(`Node.js ticket summarizer listening on port ${port}`);
});