// // config/gemini.js
// import { google } from '@ai-sdk/google';
// import { streamText, convertToModelMessages } from "ai"; // convertToCoreMessages add kiya

// export async function getAIResponse(messagesArray) {
//     try {
//         const result = streamText({
//             model: google('gemini-2.5-flash'),

//             // Frontend ke UI messages ko AI ke Core messages mein convert karna zaroori hai
//             messages: await convertToModelMessages(messagesArray),

//             system: `You are NexMind AI, a highly intelligent assistant developed by Jay. 
//                      IMPORTANT RULES:
//                      1. Your training data might be outdated. 
//                      2. You MUST ALWAYS use the 'googleSearch' tool if the user asks about sports scores, current events, recent news, or anything happening in the real world right now.
//                      3. Do not guess current events. Always search first.`,

//             tools: {
//                 googleSearch: google.tools.googleSearch({}),
//             },

//             // Tool calling sequence pura karne ke liye
//             maxSteps: 5,
//         });

//         // Hamein 'await streamText' nahi karna hai, seedha object return karna hai
//         return result; 
//     } catch (error) {
//         console.error("AI Generation Error:", error);
//         throw new Error("NextMind AI could not process the request.");
//     }
// }

// config/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Apni API key pass karein
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getAIResponseStream = async (messagesArray) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "You are NextMind AI, a highly intelligent assistant developed by Jayneel Badgujar . Always provide helpful, accurate, and nicely formatted answers."
        });

        // 1. History aur Last Message alag karein
        // Google SDK ko purani baatein 'history' array mein chahiye, aur naya sawal alag se.
        const historyMessages = messagesArray.slice(0, -1);
        const lastMessage = messagesArray[messagesArray.length - 1].content;

        // 2. Apne messages ko Google ke format (role: 'user' or 'model') mein badlein
        const formattedHistory = historyMessages.map((msg) => ({
            role: msg.role === "user" ? "user" : "model", // 'assistant' ko 'model' banaya
            parts: [{ text: msg.content }]
        }));

        // 3. Chat session start karein
        const chat = model.startChat({
            history: formattedHistory,
        });

        // 4. Stream generate karein (Verified Method: sendMessageStream)
        const result = await chat.sendMessageStream(lastMessage);
        
        return result.stream;

    } catch (error) {
        console.error("Gemini SDK Error:", error);
        throw new Error("NextMind AI failed to generate response.");
    }
}

export const generateChatTitle = async (firstMessage) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate a very short, maximum 5-word title summarizing this message. Do not use quotes or periods. Message: "${firstMessage}"`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Failed to generate chat title:", error);
        return "New Chat";
    }
}