import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey : "<write api key here>"});

async function main() {
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.1-flash-lite",
    contents: "Explain how AI works in detail",
  });

  for await (const chunk of responseStream) {
    process.stdout.write(chunk.text);
  }
}

main();