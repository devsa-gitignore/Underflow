import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const modelsToTry = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "google/gemma-2-9b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  "mistralai/mistral-7b-instruct:free"
];

async function findWorkingModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  for (const modelId of modelsToTry) {
    try {
      console.log(`Trying ${modelId}...`);
      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: modelId,
        messages: [{ role: "user", content: "hi" }],
      }, {
        headers: { "Authorization": `Bearer ${apiKey}` },
        timeout: 5000
      });
      if (response.status === 200) {
        console.log(`FOUND_WORKING_MODEL: ${modelId}`);
        process.exit(0);
      }
    } catch (err) {
      console.log(`Failed ${modelId}: ${err.message}`);
    }
  }
}

findWorkingModel();
