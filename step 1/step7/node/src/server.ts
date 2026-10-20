import "dotenv/config";

import { createApp } from "./app";
import { createMeetingService } from "./meetingservice";

const port = process.env.PORT || 8080;

const app = createApp({ meetingService: createMeetingService() });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});