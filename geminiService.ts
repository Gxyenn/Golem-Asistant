import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, Attachment } from "./types.js";

// System Instruction (Kepribadian AI)
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
    
    // 1. Cek API Key
    if (!apiKey) {
      console.error("API Key is missing in Vercel Environment Variables");
      throw new Error("API Key belum disetting. Silakan cek pengaturan Vercel.");
    }

    // 2. Inisialisasi AI (Pakai library standar)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Gunakan model yang stabil
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    // 3. Siapkan History Chat
    // Mapping role: 'assistant' -> 'model', 'user' -> 'user'
    const chatHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        { text: msg.content },
        // Handle gambar jika ada (history lama)
        ...(msg.attachments?.map(att => ({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        })) || [])
      ]
    }));

    // 4. Mulai Chatting
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7, // Kreativitas
      },
    });

    // 5. Siapkan Pesan Baru & Gambar (Jika ada)
    const messageParts: any[] = [{ text: prompt }];
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        messageParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }

    // 6. Kirim ke AI
    const result = await chat.sendMessage(messageParts);
    const response = await result.response;
    
    // Ambil text
    const text = response.text();
    return text;

  } catch (error: any) {
    console.error("ERROR GEMINI:", error);
    // Return pesan error agar muncul di chat HP (bukan cuma di console)
    return `Error Sistem: ${error.message || "Gagal menghubungi AI."}`;
  }
};