const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: listModels is on the genAI object in some versions, or requires a fetch
    // But we can try to "peek" by calling a common one.
    
    console.log("Checking API Key...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("SUCCESS on gemini-1.5-flash:", result.response.text());
  } catch (err) {
    console.error("FAIL on gemini-1.5-flash:", err.message);
  }
}

listModels();
