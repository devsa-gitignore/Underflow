import { evaluateRisk } from "./src/services/ai.service.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runTest() {
  console.log("--- Testing AI Stability (evaluateRisk) ---");
  try {
    const result = await evaluateRisk({
      bp: "140/90",
      weight: "65",
      bloodSugar: "110",
      symptoms: "Mild headache",
      otherFactors: "Age 28"
    });
    console.log("Result Success:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Result Failed:", err.message);
  }
}

runTest();
