import { GoogleGenAI } from "@google/genai";
import type { Message, Attachment } from "./types.js";

const SYSTEM_INSTRUCTION = `You are Golem, a professional, elegant, and futuristic AI assistant.
Your personality is: polite, kind, cheerful, and friendly.
Developed by Dev Stoky.
Always respond using Markdown for better readability.`;

export const sendMessageToGolem = async (
  prompt: string, 
  history: Message[], 
  _useThinking: boolean = false, 
  attachments?: { data: string; mimeType: string }[]
) => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    
    // --- DEBUGGING START ---
    console.log("Memulai request ke Gemini...");
    console.log("Status API Key:", apiKey ? "ADA (Terbaca)" : "KOSONG (Undefined)");
    if (apiKey) {
        console.log("3 Huruf awal API Key:", apiKey.substring(0, 3)); // Cek apakah AIz...
    }
    // --- DEBUGGING END ---

    if (!apiKey) {
      throw new Error("API Key belum terbaca oleh aplikasi.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.content },
        ...(msg.attachments?.map((att: Attachment) => ({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        })) || [])
      ]
    }));
    
    const currentParts: any[] = [{ text: prompt }];
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

    console.log("Mengirim data ke model: gemini-1.5-flash"); // Cek model

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    console.log("Respon diterima!");
    return response.text();
  } catch (error: any) {
    // --- PENTING: MENAMPILKAN ERROR ASLI ---
    console.error(">>> ERROR GEMINI ASLI:", error);
    console.error(">>> PESAN ERROR:", error.message);
    if (error.response) {
        console.error(">>> DETAIL:", JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
};