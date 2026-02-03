import { GoogleGenAI, Type } from "@google/genai";

// Note: We use process.env.API_KEY as per instructions.
const getAiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("API key must be set when using the Gemini API. Check your .env file.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ExtractedClientData {
  name: string;
  cif: string; // CNP for individuals
  address: string;
  city: string;
  state: string; // Județ
}

export const identifyProductFromImage = async (base64Image: string): Promise<{ name: string; price?: number; category: string }> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return { name: "Produs Necunoscut (Cheie Lipsă)", price: 0, category: "General" };
  }

  try {
    const model = 'gemini-2.5-flash';

    // We want a structured JSON response
    const response = await getAiClient().models.generateContent({
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

export const extractClientFromIdCardImage = async (base64Image: string): Promise<ExtractedClientData | null> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing.");
    return null;
  }

  try {
    const model = 'gemini-2.5-flash';

    const response = await getAiClient().models.generateContent({
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
            text: `Extract data for a Romanian CI (Carte de Identitate). 
            Identify 'Nume' and 'Prenume' and combine them into 'name'.
            Identify 'CNP' and use it as 'cif'.
            Identify 'Domiciliu' and use it as 'address'. 
            Split 'address' into 'city' (localitate) and 'state' (județ) if possible.
            Return results in JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Full name (Nume + Prenume)" },
            cif: { type: Type.STRING, description: "CNP (13 digits)" },
            address: { type: Type.STRING, description: "Full address (Domiciliu)" },
            city: { type: Type.STRING, description: "Localitate" },
            state: { type: Type.STRING, description: "Județ" }
          },
          required: ["name", "cif", "address", "city", "state"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini CI Extraction Failed:", error);
    return null;
  }
};