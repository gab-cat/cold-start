"use node";

import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface FoodAnalysis {
  isFood: boolean;
  foods: string[];
  description: string;
  estimatedCalories: number;
  confidence: number;
  portionSize: string;
}

/**
 * Analyze an image URL to identify food items and estimate calories
 * Uses Gemini 2.5 Flash with vision capabilities
 */
export const analyzeFoodImage = internalAction({
  args: {
    imageUrl: v.string(),
  },
  handler: async (_, args): Promise<FoodAnalysis> => {
    try {
      // Fetch image and convert to base64
      const imageResponse = await fetch(args.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
              {
                text: `Analyze this image carefully. Your task is to:

1. Determine if this is a food/meal image
2. If it IS food, identify all visible food items
3. Estimate the portion sizes visible
4. Calculate estimated total calories for the entire meal

Be accurate and realistic with calorie estimates. Consider:
- Visible portion sizes and serving amounts
- Cooking methods (fried vs grilled affects calories)
- Visible ingredients (sauces, oils, toppings add calories)

If this is NOT a food image (e.g., selfie, landscape, object), set isFood to false and return empty/zero values for other fields.

Respond with a JSON object containing:
- isFood: boolean - true if this is a food image
- foods: string[] - array of identified food items (e.g., ["grilled chicken breast", "white rice", "steamed broccoli"])
- description: string - a natural meal description for logging (e.g., "Grilled chicken with rice and vegetables")
- estimatedCalories: number - total estimated calories for the visible portion
- confidence: number - 0 to 1 indicating confidence in the analysis
- portionSize: string - description of portion size (e.g., "1 plate", "1 bowl", "large serving")`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              isFood: { type: "boolean" },
              foods: { type: "array", items: { type: "string" } },
              description: { type: "string" },
              estimatedCalories: { type: "number" },
              confidence: { type: "number" },
              portionSize: { type: "string" },
            },
            required: [
              "isFood",
              "foods",
              "description",
              "estimatedCalories",
              "confidence",
              "portionSize",
            ],
          },
        },
      });

      const responseText = result.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      const parsed = JSON.parse(responseText) as FoodAnalysis;

      // Validate the response
      if (typeof parsed.isFood !== "boolean") {
        throw new Error("Invalid response: isFood must be boolean");
      }

      return {
        isFood: parsed.isFood,
        foods: Array.isArray(parsed.foods) ? parsed.foods : [],
        description: parsed.description || "",
        estimatedCalories:
          typeof parsed.estimatedCalories === "number"
            ? parsed.estimatedCalories
            : 0,
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0,
        portionSize: parsed.portionSize || "1 serving",
      };
    } catch (error) {
      console.error("Error analyzing food image:", error);
      // Return a default "not food" response on error
      return {
        isFood: false,
        foods: [],
        description: "",
        estimatedCalories: 0,
        confidence: 0,
        portionSize: "",
      };
    }
  },
});
