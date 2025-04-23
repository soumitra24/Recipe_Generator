// filepath: c:\Users\kumar\OneDrive\Desktop\Rebel Minds\my-app\app\api\generate-recipe\route.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

const MODEL_NAME = "gemini-1.5-flash"; // Or another suitable model
const API_KEY = process.env.GEMINI_API_KEY || "";

// Basic safety settings - adjust as needed
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings });

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { ingredients } = await request.json(); // Get ingredients from request body

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "Missing or invalid ingredients list" }, { status: 400 });
    }

    const ingredientNames = ingredients.map((ing: { name: string }) => ing.name).join(', ');

    // Construct the prompt for Gemini
    const prompt = `
      You are a helpful recipe assistant.
      Generate a simple recipe using ONLY the following ingredients: ${ingredientNames}.
      Provide a title for the recipe, a list of the ingredients provided, and step-by-step instructions.
      Keep the instructions concise and easy to follow.
      If the ingredients don't seem sufficient for a meaningful recipe, suggest adding 1-2 common pantry staples (like salt, pepper, oil, water) if necessary, but prioritize using only the provided ingredients.
      Format the output clearly. Example:

      **Recipe Title**

      **Ingredients:**
      * Ingredient 1
      * Ingredient 2
      * ...

      **Instructions:**
      1. Step 1...
      2. Step 2...
      3. Step 3...
    `;

    const generationConfig = {
      temperature: 0.8, // Adjust creativity
      topK: 1,
      topP: 1,
      maxOutputTokens: 512, // Limit output length
    };

    // Call the Gemini API
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        // safetySettings: Adjust safety settings if needed
    });


    if (!result.response) {
        console.error("Gemini API Error: No response object received.");
        // If the response object itself is missing, we can't get candidate info easily
        return NextResponse.json({ error: "Failed to generate recipe. No response object from AI." }, { status: 500 });
      }
  
      // Access candidates and safety ratings via result.response
      const response = result.response;
  
      // Check if the response was blocked or finished unexpectedly
      if (!response.text()) {
          console.error("Gemini API Error: Response received but contains no text.");
          const finishReason = response.candidates?.[0]?.finishReason;
          const safetyRatings = response.candidates?.[0]?.safetyRatings;
  
          const reasonInfo = finishReason ? ` (Finish Reason: ${finishReason})` : '';
          const safetyInfo = safetyRatings ? ` (Safety Ratings: ${JSON.stringify(safetyRatings)})` : '';
  
          let errorMessage = "Failed to generate recipe. The AI response was empty or blocked.";
          if (finishReason === 'SAFETY') {
              errorMessage = "Failed to generate recipe due to safety settings.";
          } else if (finishReason) {
              errorMessage = `Failed to generate recipe. ${reasonInfo}`;
          }
  
          return NextResponse.json({ error: `${errorMessage}${safetyInfo}` }, { status: 500 });
      }
  
      // If we have text, return it
      const recipeText = response.text();
      return NextResponse.json({ recipeText });
  

  } catch (error: unknown) { // Changed from any to unknown
        console.error("Error calling Gemini API:", error);
        // Provide a more generic error message to the client
    
        // Safely access error properties by checking the type
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
    
        return NextResponse.json({ error: `Failed to generate recipe. ${errorMessage}` }, { status: 500 });
      }
}