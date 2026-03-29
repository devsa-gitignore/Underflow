import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testAuto() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "google/gemma-7b-it:free", // One of the most common free models
      messages: [{ role: "user", content: "hi" }],
    }, {
      headers: { "Authorization": `Bearer ${apiKey}` },
      timeout: 10000
    });
    console.log("SUCCESS:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("FAILED:", err.response?.data?.error?.message || err.message);
  }
}

testAuto();
