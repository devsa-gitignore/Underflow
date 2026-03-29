import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("ping");
    console.log("SUCCESS on gemini-1.5-flash:", result.response.text());
  } catch (err) {
    console.error("FAIL on gemini-1.5-flash:", err.message);
  }
}

check();
