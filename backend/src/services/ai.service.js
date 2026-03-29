import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

/**
 * Robust JSON extraction from AI response
 */
const cleanAIResponse = (text) => {
    try {
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("[AI] Standard JSON parse failed, attempting regex extraction...");
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerE) {
                console.error("[AI] Regex extraction failed too:", text);
                throw new Error("AI provider returned invalid JSON format.");
            }
        }
        throw new Error("AI provider returned invalid JSON format.");
    }
};

/**
 * Multi-Provider AI Caller with Triple-Tier Fallback (Now including Stepfun)
 */
const callAI = async (prompt, systemInstruction = "") => {
    // 1. Try OpenRouter (Primary) - Gemma 3 4B Free
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log("[AI] Attempting OpenRouter (google/gemma-3-4b-it:free)...");
            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "google/gemma-3-4b-it:free", 
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Swasthya Sathi ASHA Portal"
                },
                timeout: 10000 
            });

            if (response.data?.choices?.[0]?.message?.content) {
                return cleanAIResponse(response.data.choices[0].message.content);
            }
        } catch (error) {
            console.error("[AI] OpenRouter (Gemma) failed, falling back to Gemini 3.1 SDK:", error.response?.data?.error?.message || error.message);
        }
    }

    // 2. Try Google Gemini SDK (Verified 3.1 Preview Fallback)
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("[AI] Falling back to Gemini SDK (gemini-3.1-flash-lite-preview)...");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
            const result = await model.generateContent(systemInstruction + "\n\n" + prompt);
            return cleanAIResponse(result.response.text());
        } catch (error) {
            console.error("[AI] Gemini 3.1 Preview SDK failed, falling back to Stepfun:", error.message);
        }
    }

    // 3. Try Stepfun (Ultra-Resilient Fallback via OpenRouter)
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log("[AI] Falling back to Stepfun (stepfun/step-3.5-flash:free)...");
            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "stepfun/step-3.5-flash:free", 
                messages: [{ role: "user", content: systemInstruction + "\n\n" + prompt }]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Swasthya Sathi ASHA Portal"
                },
                timeout: 10000 
            });

            if (response.data?.choices?.[0]?.message?.content) {
                return cleanAIResponse(response.data.choices[0].message.content);
            }
        } catch (error) {
            console.error("[AI] Stepfun Fallback failed:", error.response?.data?.error?.message || error.message);
            throw new Error("All AI providers (OpenRouter/Gemini/Stepfun) are currently unavailable.");
        }
    }

    throw new Error("No AI providers available on free tier.");
};

export const evaluateRisk = async ({ bp, weight, bloodSugar, symptoms, otherFactors }) => {
    const systemInstruction = "You are an expert maternal healthcare AI. Return ONLY valid JSON.";
    const prompt = `
Analyze Patient Health:
- BP: ${bp || "Not provided"}
- Weight: ${weight || "Not provided"} kg
- Sugar: ${bloodSugar || "Not provided"} mg/dL
- Symptoms: ${symptoms || "None"}

Risk Assess & Return ONLY JSON:
{
  "riskLevel": "LOW" | "MODERATE" | "HIGH",
  "possibleCondition": "String",
  "immediateActionRequired": boolean,
  "adviceForAshaWorker": "Clear advice"
}`;

    return await callAI(prompt, systemInstruction);
};

export const generateTimeline = async ({ age, conditions, currentMonth }) => {
    const systemInstruction = "You are an expert obstetrician AI. Return ONLY a JSON array of 9 months.";
    const month = parseInt(currentMonth) || 1;

    const prompt = `
Personalized Care Timeline (9 Months):
Patient: Age ${age}, Conditions: ${conditions}. Current Month: ${month}.

Return ONLY a JSON array with exactly 9 objects:
{
  "monthNumber": number,
  "isCurrent": boolean,
  "isCompleted": boolean,
  "title": "Focus",
  "summary": "Summary",
  "symptoms": "Symptoms",
  "dietaryAdvice": "Advice",
  "warnings": "Red flags"
}`;

    return await callAI(prompt, systemInstruction);
};

export const detectEpidemic = async (aggregatedDataText) => {
    const systemInstruction = "You are a public health AI. Return ONLY valid JSON report.";
    const prompt = `
Analyze regional health data:
${aggregatedDataText}

Identify outbreaks. Return:
{
  "alertLevel": "NORMAL" | "WARNING" | "CRITICAL",
  "findings": "Summary",
  "recommendations": "Actions"
}`;

    return await callAI(prompt, systemInstruction);
};
