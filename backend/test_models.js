import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // There isn't a direct listModels in the standard JS SDK like this easily,
    // but we can try to generate content with a common one and see if it works.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Gemini 1.5 Flash check:", result.response.text());
  } catch (err) {
    console.error("Gemini 1.5 Flash failed:", err.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
    const result = await model.generateContent("test");
    console.log("Gemini 2.0 Flash Lite check:", result.response.text());
  } catch (err) {
    console.error("Gemini 2.0 Flash Lite failed:", err.message);
  }

  try {
     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
     const result = await model.generateContent("test");
     console.log("Gemini 2.5 Flash Lite check:", result.response.text());
  } catch (err) {
     console.error("Gemini 2.5 Flash Lite failed:", err.message);
  }
}

listModels();
