
import { GoogleGenAI, Type } from "@google/genai";

export const generateProductDescription = async (productName: string, category: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a compelling, SEO-friendly eCommerce product description for a "${productName}" in the "${category}" category. Focus on benefits, features, and target audience.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating description:", error);
    return "High quality product available at the best price.";
  }
};

export const smartProductFill = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract product details from this text: "${prompt}". 
      Return a JSON object with: name, brand, category (one of: Electronics, Fashion, Home & Living, Health & Beauty, Groceries, Sports), price (number), specialPrice (number), stock (number), description, packageDetails (object with size, weight, qtyPerPackage).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            specialPrice: { type: Type.NUMBER },
            stock: { type: Type.NUMBER },
            description: { type: Type.STRING },
            packageDetails: {
              type: Type.OBJECT,
              properties: {
                size: { type: Type.STRING },
                weight: { type: Type.STRING },
                qtyPerPackage: { type: Type.STRING }
              }
            }
          },
          required: ["name", "category", "price", "stock"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error in AI Smart Fill:", error);
    return null;
  }
};
