
// working 

// import { GoogleGenAI } from "@google/genai";

// // The client gets the API key from the environment variable `GEMINI_API_KEY`.
// const ai = new GoogleGenAI({});

// export async function getAIResponse(message) {
//   const response = await ai.models.generateContent({
//     model: "gemini-3-flash-preview",
//     contents: message,
//   });
//   return response.text;
// }

// ai/


import { tavilySearch } from "@tavily/ai-sdk";
import { google } from '@ai-sdk/google';
import { generateText } from "ai";

export async function getAIResponse(message) {
    try {
        const { text } = await generateText({
            // Note: Make sure model name is correct (gemini-1.5-pro ya gemini-1.5-flash)
            // 'gemini-2.5-flash' abhi standard string nahi hai, but agar aap early access me hain toh theek hai.
            model: google('gemini-2.5-flash'), 
            
            prompt: message,
            
            // System prompt ko thoda strict banaya hai
            system: `You are NextMind AI, a highly intelligent assistant developed by Jay. 
                     IMPORTANT RULES:
                     1. Your training data might be outdated. 
                     2. You MUST ALWAYS use the 'tavilySearch' tool if the user asks about sports scores, current events, recent news, or anything happening in the real world right now.
                     3. Do not guess current events. Always search first.`,
            
            tools: {
                tavilySearch: tavilySearch(),
            },
            
            // Ye sabse zaroori line hai tool calling complete karne ke liye
            maxSteps: 5, 
        });

        return text;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("NexMind AI could not process the request.");
    }
}