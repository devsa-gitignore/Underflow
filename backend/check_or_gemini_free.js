import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const modelsToTry = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-1.5-flash-8b:free",
  "google/gemini-2.0-flash-lite-preview-02-05:free"
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
      if (response.data?.choices?.[0]?.message?.content) {
          console.log(`Model ${modelId}: OK`);
          break;
      }
    } catch (err) {
      console.log(`Model ${modelId}: FAIL - ${err.response?.data?.error?.message || err.message}`);
    }
  }
}

testOpenRouter();
