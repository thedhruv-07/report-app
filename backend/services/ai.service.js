const fs = require("fs");
const Groq = require("groq-sdk");
const { MEMORY_PATH, GROQ_API_KEY } = require("../config/config");

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

const getAISuggestion = async (context, partialText) => {
  try {
    if (!partialText) return "";
    
    // 1. Local Memory Match
    const memory = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8"));
    const localMatch = memory.find(m => m.toLowerCase().startsWith(partialText.toLowerCase()));
    if (localMatch && typeof localMatch === "string") return localMatch.slice(partialText.length);

    // 2. Groq AI Match
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "Professional completion assistant. Context: " + context }, 
            { role: "user", content: "Type: " + partialText }
          ],
          model: "llama-3.3-70b-versatile",
        });
        const suggestion = completion.choices[0]?.message?.content?.trim();
        if (suggestion) return suggestion;
      } catch (e) {
        console.error("Groq Error:", e);
      }
    }
    
    return "";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "";
  }
};

module.exports = {
  learnFromReport,
  getAISuggestion,
};
