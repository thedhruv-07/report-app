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

const analyzeVision = async (images, count = 5) => {
  try {
    if (!images || !Array.isArray(images) || images.length === 0) return "";

    const numPhotos = images.length;

    // Use Groq text model to generate multiple photo description suggestions
    if (groq) {
      const prompt = `You are a professional quality control inspector writing descriptions for inspection photos.
Generate exactly ${count} different, concise, professional photo description suggestions for a batch of ${numPhotos} inspection photo${numPhotos > 1 ? "s" : ""}.
Each suggestion should be realistic, varied, and cover different possible scenarios (e.g., product overview, defect documentation, packaging check, label verification, carton inspection).
Format: Return ONLY a numbered list like:
1. <description>
2. <description>
3. <description>
4. <description>
5. <description>

No extra text, no explanations.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a professional quality control inspector assistant. Always respond with a numbered list only." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: 400,
        temperature: 0.8,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      // Parse numbered list
      const suggestions = raw
        .split(/\n/)
        .map(line => line.replace(/^\d+\.\s*/, "").trim())
        .filter(line => line.length > 5);

      // Return as a parseable format
      return suggestions
        .slice(0, count)
        .map((s, i) => `Suggestion ${i + 1}: ${s}`)
        .join("\n");
    }

    // Fallback static suggestions if Groq is unavailable
    const fallbacks = [
      "Overview of finished goods ready for shipment inspection.",
      "Carton markings and label verification during pre-shipment check.",
      "Product workmanship and surface finish quality check.",
      "Packaging integrity and sealing condition assessment.",
      "Defect documentation — minor cosmetic issues observed.",
    ];
    return fallbacks.slice(0, Math.min(count, fallbacks.length))
      .map((s, i) => `Suggestion ${i + 1}: ${s}`)
      .join("\n");

  } catch (error) {
    console.error("Vision AI Error:", error);
    return "";
  }
};

const analyzeIndividualPhotos = async (imageDatas) => {
  try {
    if (!groq || !imageDatas || !Array.isArray(imageDatas) || imageDatas.length === 0) {
      return imageDatas.map(() => "Photo overview — no specific analysis available.");
    }

    const results = [];
    console.log(`📸 Analyzing ${imageDatas.length} photos individually...`);

    // Process sequentially to avoid hitting concurrent request limits or rate limits on preview models
    for (let i = 0; i < imageDatas.length; i++) {
        try {
            // If it's a large batch, add a tiny delay between requests to avoid RPM issues
            if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));

            const imageData = imageDatas[i];
            let imageUrl = imageData;
            
            // If it's just raw base64, wrap it. If it's a data URL, use as-is.
            if (!imageData.startsWith("data:")) {
                imageUrl = `data:image/jpeg;base64,${imageData}`;
            }

            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user", // Some vision models prefer all context in the user role
                        content: [
                            { 
                                type: "text", 
                                text: "You are a professional inspection assistant. Provide a concise, one-sentence technical description for this inspection photo (e.g., 'Overview of product packaging', 'Close-up of safety label'). No conversational filler." 
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl,
                                },
                            },
                        ],
                    },
                ],
                model: "llava-v1.5-7b-4096-preview",
                max_tokens: 150,
                temperature: 0.1,
            });

            const content = response.choices[0]?.message?.content?.trim();
            results.push(content || "Inspection photo overview.");
            console.log(`✅ AI Response for photo ${i + 1}: ${content}`);
        } catch (err) {
            console.error(`❌ AI Analysis Error (Photo ${i + 1}):`, err.status, err.message);
            // Provide a slightly more useful fallback if it's a known error type
            if (err.status === 429) {
                results.push("Error: AI Rate Limit (Wait a minute)");
            } else if (err.status === 400 || err.status === 404) {
                results.push("Error: AI Model Issue");
            } else {
                results.push("Inspection photo (pending manual review).");
            }
        }
    }

    return results;
  } catch (error) {
    console.error("CRITICAL: Individual Photos AI Main Error:", error);
    return imageDatas.map(() => "Inspection photo.");
  }
};

module.exports = {
  learnFromReport,
  getAISuggestion,
  analyzeVision,
  analyzeIndividualPhotos,
};
