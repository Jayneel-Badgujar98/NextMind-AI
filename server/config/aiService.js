// server/config/aiService.js
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Initialize the brand new official Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Asynchronously retrieves file bytes from a local file path or remote URL and converts them to base64.
 * Handles both development local file fallbacks and production Cloudinary CDN links.
 * 
 * @param {Object} att - The attachment object { name, type, url, base64 }
 * @returns {Promise<string|null>} - Base64 string without data prefix
 */
async function resolveAttachmentToBase64(att) {
    if (att.base64) {
        // If base64 is already present, just strip the scheme prefix if it exists
        return att.base64.includes(';base64,') 
            ? att.base64.split(';base64,')[1] 
            : att.base64;
    }

    if (att.url) {
        try {
            // Case 1: Local server uploads path
            if (att.url.includes('/uploads/')) {
                const filename = att.url.split('/uploads/')[1];
                const localPath = path.join(process.cwd(), 'uploads', filename);
                if (fs.existsSync(localPath)) {
                    const buffer = fs.readFileSync(localPath);
                    return buffer.toString('base64');
                }
            }

            // Case 2: Remote URL (e.g. Cloudinary CDN or absolute local URL fallback)
            console.log(`Resolving remote attachment URL to base64: ${att.url}`);
            const response = await axios.get(att.url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (err) {
            console.error(`Failed to resolve attachment to base64 for ${att.url}:`, err.message);
            return null;
        }
    }

    return null;
}

/**
 * Generates a streaming response for the chat using Google's official new @google/genai SDK.
 * Note: Google Search Grounding is removed by default because Google AI Studio Free Tier
 * blocks search grounding requests with a 429 quota exhaustion error.
 * 
 * @param {Array} messagesArray - Array of UI messages { role, content }
 * @returns {Promise<AsyncGenerator>} - Async stream generator
 */
export async function getAIResponseStream(messagesArray) {
    try {
        // Map messages to Google GenAI format asynchronously to resolve file bytes
        const formattedContents = await Promise.all(messagesArray.map(async (msg) => {
            
            const parts = [];
            
            // Add text part if text is present
            if (msg.content && msg.content.trim() !== '') {
                parts.push({ text: msg.content });
            } else if (!msg.attachments || msg.attachments.length === 0) {
                // Gemini requires at least one part per message block
                parts.push({ text: " " });
            }
            
            // Add file attachments as inlineData parts
            if (msg.attachments && Array.isArray(msg.attachments)) {
                for (const att of msg.attachments) {
                    const base64Data = await resolveAttachmentToBase64(att);
                    if (base64Data) {
                        parts.push({
                            inlineData: {
                                data: base64Data,
                                mimeType: att.type || 'image/jpeg'
                            }
                        });
                    }
                }
            }
            
            return {
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts
            };
        }));

        const responseStream = await ai.models.generateContentStream({
            // Using the requested brand new stable Gemini 3.5 model!
            model: "gemini-3.1-flash-lite",
            contents: formattedContents,
            config: {
                systemInstruction: `You are NextMind AI, a highly intelligent, next-generation premium AI assistant developed by Jayneel Badgujar. 
                     
                    Always provide exceptionally helpful, accurate, and beautifully formatted markdown responses.
                     
                   You can natively analyze, interpret, and discuss images (PNG, JPG, WEBP) and PDF documents shared by the user in the prompt.
                    `,
            },
        });

        return responseStream;
    } catch (error) {
        console.error("Google GenAI Streaming Generation Error:", error);
        throw new Error(error.message || "NextMind AI failed to generate response.");
    }
}

/**
 * Generates a short title (max 5 words) for a chat thread based on the first message.
 * 
 * @param {string} firstMessage - The user's initial message
 * @returns {Promise<string>}
 */
export async function generateChatTitle(firstMessage) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: `Generate a very short, maximum 5-word title summarizing this message. Do not use quotes, colons, or periods. Message: "${firstMessage}"`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate chat title with Google GenAI SDK:", error);
        return "New Chat";
    }
}