
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Meal, Profile } from "../types";

export const saveToDriveTool: FunctionDeclaration = {
  name: 'organizeAndSaveToDrive',
  parameters: {
    type: Type.OBJECT,
    description: 'Organiza todos os dados atuais em pastas e salva no Google Drive.',
    properties: {
      folderName: {
        type: Type.STRING,
        description: 'Nome da pasta principal.',
      },
    },
    required: ['folderName'],
  },
};

export class GeminiService {
  private model: string = 'gemini-3-flash-preview';

  async generateResponse(history: { role: 'user' | 'model', parts: { text: string }[] }[], userInput: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contents = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: h.parts
      }));

      const response = await ai.models.generateContent({
        model: this.model,
        contents: [
          ...contents,
          { role: 'user', parts: [{ text: userInput }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          tools: [{ functionDeclarations: [saveToDriveTool] }],
        },
      });

      return response;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  async generateShoppingList(meals: Meal[], profiles: Profile[]): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Gere uma lista de compras baseada em: ${meals.map(m => m.descricao).join(', ')}.`;
      const response = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      return response.text || "Erro ao gerar lista.";
    } catch (e) {
      return "Erro Gemini.";
    }
  }
}

export const geminiService = new GeminiService();
