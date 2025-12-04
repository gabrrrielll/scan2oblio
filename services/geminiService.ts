import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// Note: We use process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const identifyProductFromImage = async (base64Image: string): Promise<{ name: string; price?: number; category: string }> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return { name: "Produs Necunoscut (Cheie Lipsă)", price: 0, category: "General" };
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // We want a structured JSON response
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this product image. Extract or estimate the product name (in Romanian), an estimated price in RON (number only), and a general category. Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Numele produsului în limba Română" },
            price: { type: Type.NUMBER, description: "Prețul estimat în RON" },
            category: { type: Type.STRING, description: "Categoria produsului" }
          },
          required: ["name", "price", "category"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return { name: "Produs Neidentificat", price: 0, category: "General" };
  }
};