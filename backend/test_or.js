import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("No OPENROUTER_API_KEY found");
    return;
  }
  
  console.log("Testing OpenRouter with key starting with:", apiKey.slice(0, 10));
  
  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "google/gemini-2.0-flash-lite:free",
                messages: [
                    { role: "user", content: "ping" }
                ],
            }, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 5000
            });
    console.log("OpenRouter Success:", response.data.choices[0].message.content);
  } catch (err) {
    console.error("OpenRouter Failed:", err.response?.data || err.message);
  }
}

testOpenRouter();
