import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testRest() {
  const apiKey = process.env.GEMINI_API_KEY;
  // Try 8B version
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;
  
  try {
    console.log("Testing Gemini 1.5 Flash 8B REST API (v1beta)...");
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "ping" }] }]
    });
    console.log("REST SUCCESS:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("REST FAIL:", err.response?.data?.error?.message || err.message);
  }
}

testRest();
