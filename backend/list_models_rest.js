import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function listGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    console.log("Listing Gemini models for this key...");
    const response = await axios.get(url);
    const models = response.data.models.map(m => m.name);
    console.log("AVAILABLE_MODELS:", models);
  } catch (err) {
    console.error("LISTING FAIL:", err.response?.data?.error?.message || err.message);
  }
}

listGeminiModels();
