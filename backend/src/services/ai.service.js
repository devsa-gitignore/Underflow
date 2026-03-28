import { GoogleGenerativeAI } from '@google/generative-ai';

export const evaluateRisk = async ({ bp, weight, bloodSugar, symptoms, otherFactors }) => {
    // Make sure API key is available
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the environment variables");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use 2.5 flash model for fast inference
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are an expert maternal healthcare AI designed to assist ASHA workers in rural areas. 
Analyze the following pregnant patient data collected during a routine checkup:
- Blood Pressure: ${bp || "Not provided"}
- Weight: ${weight || "Not provided"}
- Blood Sugar: ${bloodSugar || "Not provided"}
- Symptoms reported: ${symptoms || "None"}
- Other factors/notes: ${otherFactors || "None"}

Determine the risk level for pregnancy complications (e.g., Preeclampsia, Gestational Diabetes, Anemia, etc.).
Return ONLY a JSON object with this exact schema (no markdown, no backticks, just raw JSON). Do not return any other text.
{
  "riskLevel": "LOW" | "MODERATE" | "HIGH",
  "possibleCondition": "String describing potential condition (or 'None identified')",
  "immediateActionRequired": boolean,
  "adviceForAshaWorker": "Clear, actionable advice for the healthcare worker"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
        // Strip markdown codeblocks if AI happens to add them
        const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("AI Output parsing error:", responseText);
        throw new Error("Failed to parse AI response into valid JSON");
    }
};

export const generateTimeline = async ({ age, lmp, conditions, currentMonth }) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the environment variables");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Ensure currentMonth is an integer for logical comparisons in the prompt
    const month = parseInt(currentMonth) || 1;

    const prompt = `
You are an expert obstetrician AI assisting an ASHA worker. 
Generate a quick pregnancy timeline summary for patient:
- Age: ${age || "Not provided"}
- Pre-existing Conditions: ${conditions || "None"}
- Current Pregnancy Month: ${month}

Return ONLY a JSON array with exactly 3 key milestones: {1: First trimester}, {current: Month ${month}}, {9: Third trimester delivery}.
[
  {
    "monthNumber": 1,
    "isCurrent": ${month === 1},
    "title": "First Trimester",
    "summary": "Brief fetal and maternal changes",
    "symptoms": "Common symptoms to expect",
    "dietaryAdvice": "Key nutrition tips",
    "warnings": "Red flags requiring urgent care"
  },
  {
    "monthNumber": ${month},
    "isCurrent": true,
    "title": "Current Month",
    "summary": "What to expect now",
    "symptoms": "Current stage symptoms",
    "dietaryAdvice": "Current nutrition needs",
    "warnings": "Current red flags"
  },
  {
    "monthNumber": 9,
    "isCurrent": false,
    "title": "Third Trimester & Delivery",
    "summary": "Final weeks and labor prep",
    "symptoms": "Pre-labor symptoms",
    "dietaryAdvice": "Pre-delivery nutrition",
    "warnings": "Delivery complications to watch"
  }
]
Return ONLY raw JSON. Do not wrap in markdown backticks.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
        const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("AI Output parsing error:", responseText);
        throw new Error("Failed to parse AI timeline response into valid JSON");
    }
};

export const detectEpidemic = async (aggregatedDataText) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the environment variables");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are a public health AI analyzing aggregated checkup data for a rural region over the last 7 days.
Data Summary:
${aggregatedDataText}

Task: Identify any signs of localized epidemics, contagious outbreaks, or systemic malnutrition.
Return ONLY a JSON object with this exact schema (no markdown formatting, just raw JSON):
{
  "alertLevel": "NORMAL" | "WARNING" | "CRITICAL",
  "findings": "Summary of any unusual patterns detected or 'No unusual patterns'",
  "recommendations": "Actionable public health recommendations"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
        const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("AI Output parsing error:", responseText);
        throw new Error("Failed to parse AI epidemic response into valid JSON");
    }
};
