import { OpenRouter } from "@openrouter/sdk";

const DEFAULT_MODEL = "openai/gpt-5.6-luna";

// MeetingDetails.java -> a plain type (no getters/setters needed)
export interface MeetingDetails {
  title: string | null;
  attendee: string | null;
  date: string | null; // yyyy-MM-dd
  time: string | null; // HH:mm
  durationMinutes: number | null;
}

export interface MeetingService {
  schedule(message: string): Promise<MeetingDetails>;
}

// Equivalent of Spring AI's .entity(MeetingDetails.class):
// a JSON schema that forces the model to return this exact shape.
const meetingSchema = {
  type: "object",
  properties: {
    title: { type: ["string", "null"] },
    attendee: { type: ["string", "null"] },
    date: { type: ["string", "null"], description: "yyyy-MM-dd" },
    time: { type: ["string", "null"], description: "24-hour HH:mm" },
    durationMinutes: { type: ["integer", "null"] },
  },
  required: ["title", "attendee", "date", "time", "durationMinutes"],
  additionalProperties: false,
} as const;

// LocalDate.now() -> yyyy-MM-dd in local time
function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

function buildSystemPrompt(): string {
  return `You extract meeting information from the user's request.

Today's date is ${today()}.

Rules:

- Convert relative dates like today and tomorrow
  into yyyy-MM-dd format.

- Convert time into 24-hour HH:mm format.

- If title is missing, create a simple title.

- If duration is missing, use 30 minutes.

- Do not invent attendee, date or time.

- If information is missing, keep it blank.`;
}

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v : null;

export function createMeetingService({
  client = new OpenRouter({ apiKey: process.env.API_KEY }),
  model = process.env.MODEL || DEFAULT_MODEL,
}: {
  client?: OpenRouter;
  model?: string;
} = {}): MeetingService {
  return {
    async schedule(message) {
      const result = await client.chat.send({
        chatRequest: {
          model,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: message },
          ],
            maxTokens: 300,
          responseFormat: {
            type: "json_schema",
            jsonSchema: {
              name: "meeting_details",
              strict: true,
              schema: meetingSchema,
            },
          },
          stream: false,
        },
      });

      if (!("choices" in result)) {
        throw new Error("Expected a non-streaming response");
      }
      const content = result.choices[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("Model returned no content");
      }

      // Some models wrap JSON in ```json fences, so strip them defensively
      const raw = JSON.parse(content.replace(/```json|```/g, "").trim());

      return {
        title: strOrNull(raw.title),
        attendee: strOrNull(raw.attendee),
        date: strOrNull(raw.date),
        time: strOrNull(raw.time),
        durationMinutes:
          typeof raw.durationMinutes === "number" ? raw.durationMinutes : 30,
      };
    },
  };
}