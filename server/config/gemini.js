
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

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function getAIResponse(message) {

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: message,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    });

    return text;
}
