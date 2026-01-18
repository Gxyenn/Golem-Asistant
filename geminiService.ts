import { GoogleGenAI } from "@google/genai";
import type { Message, Attachment } from "./types.js";

const SYSTEM_INSTRUCTION = `You are Golem, a professional, elegant, and futuristic AI assistant.
Your personality is: polite, kind, cheerful, and friendly.
Developed by Dev Stoky.
Always respond using Markdown for better readability. Use code blocks for snippets, tables for data, and bold text for emphasis.
If the user uploads a file, analyze it thoroughly and provide insights.
Be clear, helpful, and sophisticated.`;

export const sendMessageToGolem = async (
  prompt: string, 
  history: Message[], 
  useThinking: boolean = false,
  attachments?: { data: string; mimeType: string }[]
) => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY is not set in environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    // Konversi riwayat pesan ke format Gemini API
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.content || "" },
        ...(msg.attachments?.map((att: Attachment) => ({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        })) || [])
      ]
    }));
    
    // Siapkan pesan terbaru dari user
    const currentParts: any[] = [{ text: prompt || "Analyze this" }];
    if (attachments) {
      attachments.forEach(att => {
        currentParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // Pemilihan model: 
    // Menggunakan gemini-2.0-flash-thinking untuk mode 'Thinking' 
    // dan gemini-1.5-flash untuk mode normal agar cepat dan stabil.
    const modelName = useThinking 
      ? 'gemini-2.0-flash-thinking-exp-1219' 
      : 'gemini-1.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        // Konfigurasi Thinking hanya aktif jika useThinking bernilai true
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 1024 } } : {})
      },
    });

    // Mengambil teks dari response (di SDK @google/genai, ini adalah properti string)
    return response.text || "I'm sorry, I couldn't generate a response.";
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};