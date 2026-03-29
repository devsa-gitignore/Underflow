import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function testWithV1() {
  try {
    console.log("Testing gemini-1.5-flash with apiVersion: v1");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, "v1"); 
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("ping");
    console.log("V1 SUCCESS:", result.response.text());
  } catch (err) {
    console.error("V1 FAIL:", err.message);
  }

  try {
    console.log("Testing gemini-1.5-flash with default (v1beta)");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("ping");
    console.log("Default SUCCESS:", result.response.text());
  } catch (err) {
    console.error("Default FAIL:", err.message);
  }
}

testWithV1();
