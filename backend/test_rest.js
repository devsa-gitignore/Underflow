import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testRest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  try {
    console.log("Testing Gemini REST API (v1beta)...");
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "ping" }] }]
    });
    console.log("REST SUCCESS:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("REST FAIL:", err.response?.data?.error?.message || err.message);
  }
}

testRest();
