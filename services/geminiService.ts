import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Initialize the client strictly with the env variable as requested
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = (history?: Content[]): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview', // Using the requested advanced model for teaching
    history: history,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4,
      maxOutputTokens: 2000,
    },
  });
};

export const sendMessageStream = async (chat: Chat, message: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const responseStream = await chat.sendMessageStream({ message });
    return responseStream;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

export const generateTutorialImage = async (prompt: string): Promise<string | null> => {
  try {
    // Enhance the prompt with specific style instructions requested by user
    // "diagrama técnico limpio con degradados suaves y bordes definidos"
    const styleInstruction = "diagrama técnico limpio con degradados suaves y bordes definidos, estilo vectorial UI moderno, esquema de colores violeta y blanco similar a la interfaz de Make.com (Integromat). Alta resolución, minimalista y educativo";
    
    const enhancedPrompt = `${styleInstruction}. Visualización de: ${prompt}`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9', // Ensures consistent landscape resolution (HD/720p+)
        outputMimeType: 'image/jpeg',
      },
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    return base64Image || null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};