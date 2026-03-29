import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const modelsToTry = [
  "google/gemini-2.0-flash-lite-preview-02-05:free",
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-flash-1.5-8b:free",
  "google/gemini-flash-1.5",
  "google/gemini-2.0-flash-exp"
];

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  for (const modelId of modelsToTry) {
    try {
      console.log(`Checking ${modelId}...`);
      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: modelId,
        messages: [{ role: "user", content: "ping" }],
      }, {
        headers: { "Authorization": `Bearer ${apiKey}` },
        timeout: 5000
      });
      console.log(`Model ${modelId}: OK`);
      break; 
    } catch (err) {
      console.log(`Model ${modelId}: FAIL - ${err.response?.data?.error?.message || err.message}`);
    }
  }
}

testOpenRouter();
