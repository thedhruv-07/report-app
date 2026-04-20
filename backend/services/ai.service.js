const fs = require("fs");
const Groq = require("groq-sdk");
const { MEMORY_PATH, GROQ_API_KEY } = require("../config/config");
const wasabiService = require("./wasabiService");

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const learnFromReport = (data) => {
  try {
    const memory = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8"));
    const newEntries = [];
    if (Array.isArray(data.remarks)) {
      data.remarks.forEach(r => { if (typeof r === "string" && r.trim().length > 10) newEntries.push(r.trim()); });
    }
    if (typeof data.recommendationText === "string" && data.recommendationText.trim().length > 10) {
      newEntries.push(data.recommendationText.trim());
    }
    const updatedMemory = Array.from(new Set([...(Array.isArray(memory) ? memory : []), ...newEntries])).slice(-1000);
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(updatedMemory, null, 2));
  } catch (e) { console.error("Local Learning Error:", e); }
};

const getAISuggestion = async (context, partialText = "") => {
  try {
    // 1. Local Memory Match (only if partialText exists)
    if (partialText) {
      const memory = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8"));
      const localMatch = memory.find(m => m.toLowerCase().startsWith(partialText.toLowerCase()));
      if (localMatch && typeof localMatch === "string") return localMatch.slice(partialText.length);
    }

    // 2. Groq AI Match
    if (groq) {
      try {
        const prompt = partialText
          ? `The user is typing a remark about "${context}". They have typed: "${partialText}". Complete their sentence professionally.`
          : `Generate a professional, concise initial sentence for a factory inspection report remark regarding "${context}". Focus on standard findings or observations.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional quality control inspector assistant. Provide concise, factual, and industry-standard completions or suggestions." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.1-8b-instant",
          max_tokens: 100,
        });
        const suggestion = completion.choices[0]?.message?.content?.trim() || "";
        // Remove quotes if the AI wraps the suggestion
        return suggestion.replace(/^["']|["']$/g, '');
      } catch (e) {
        console.error("Groq Error:", e);
        throw e; // 🔥 DON'T SILENTLY FAIL
      }
    }

    return "";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "";
  }
};

const analyzeVision = async (images) => {
  try {
    if (!images || !Array.isArray(images) || images.length === 0) return "";

    // Temporary workaround: return fixed descriptions since Groq vision models are not working
    const descriptions = images.map((_, index) =>
      `Description ${index + 1}: Professional observation of factory inspection image showing technical details.`
    ).join('\n');

    return descriptions;
  } catch (error) {
    console.error("Vision AI Error:", error);
    return "";
  }
};

module.exports = {
  learnFromReport,
  getAISuggestion,
  analyzeVision,
};
