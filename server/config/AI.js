import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey : "AIzaSyBqYvsUloUcz3_z7NnQOI7nY0zr8yX-87M"});

// async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-3.1-flash-lite",
//     contents: "What can you do and also who are you  ?",
//   });
//   console.log(response.text);
// }


// await main();

async function main() {
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.5-flash",
    contents: "Explain how AI works in detail",
  });

  for await (const chunk of responseStream) {
    process.stdout.write(chunk.text);
  }
}

main();