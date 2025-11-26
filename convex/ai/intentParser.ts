"use node";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Zod schema for structured intent parsing
const ParsedIntentSchema = z.object({
  intent: z.enum(["log_activity", "ask_advice", "check_status", "set_goal", "update_weight", "other"]),
  activityType: z.union([
    z.enum([
      // Exercise activities
      "workout", "walk", "run", "yoga", "cycle", "swim", "gym", "meditation", "stretch",
      // Wellness activities
      "sleep", "hydration", "meal", "weight_check",
      // Leisure activities
      "gaming", "computer", "reading", "tv", "music", "social", "hobby", "leisure",
      // Errands and tasks
      "errand", "task", "shopping", "study"
    ]),
    z.null(),
  ]),
  value: z.union([z.number(), z.null()]),
  unit: z.union([
    z.enum(["km", "minutes", "hours", "ml", "meals", "pages", "steps", "kg", "lbs"]),
    z.null(),
  ]),
  confidence: z.number().min(0).max(1),
  extracted_data: z.record(z.any()),
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export async function parseUserIntent(
  userMessage: string
): Promise<ParsedIntent> {
  const prompt = `
Analyze this user message and extract structured intent.

User message: "${userMessage}"

Extract the intent and relevant data from the message. Be specific about activity types and values.
`;

  try {
    const jsonSchema = zodToJsonSchema(ParsedIntentSchema);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("Empty response from AI model");
    }
    const parsedResult = JSON.parse(responseText);
    return ParsedIntentSchema.parse(parsedResult);
  } catch (error) {
    console.error("Error parsing intent:", error);
    // Fallback if parsing fails
    return {
      intent: "other",
      activityType: null,
      value: null,
      unit: null,
      confidence: 0,
      extracted_data: {},
    };
  }
}

