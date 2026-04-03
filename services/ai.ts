
import { GoogleGenAI } from "@google/genai";

export const AIService = {
  enhanceInstructions: async (instructions: string, occasion: string, artistName: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Você é um assistente criativo para a plataforma Kassumuna (um Cameo de Angola).
      O usuário quer pedir um vídeo para o artista ${artistName} para a ocasião de ${occasion}.
      As instruções originais são: "${instructions}".
      
      Melhore esse texto para ser mais criativo, emocionante ou engraçado (dependendo da ocasião). 
      Use gírias angolanas leves e naturais (ex: mambo, bue, wi, brada, kumbu) se fizer sentido.
      Mantenha o texto curto (máximo 200 caracteres) pois o artista vai ler.
      Retorne APENAS o texto melhorado, sem explicações.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || instructions;
    } catch (error) {
      console.error("Erro ao chamar Gemini:", error);
      return instructions;
    }
  }
};
