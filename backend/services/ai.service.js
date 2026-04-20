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

const analyzeIndividualPhotos = async (imageObjects) => {
  try {
    if (!groq || !imageObjects || !Array.isArray(imageObjects) || imageObjects.length === 0) {
      return imageObjects.map(() => "Inspection photo.");
    }

    const results = [];
    console.log(`📸 Analyzing ${imageObjects.length} photos with smart fallbacks...`);

    for (let i = 0; i < imageObjects.length; i++) {
        try {
            if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));

            const { data, fileName } = imageObjects[i];
            
            // --- TRY VISION FIRST (Stable model) ---
            try {
                const response = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Briefly describe this inspection photo in one technical sentence." },
                                { type: "image_url", image_url: { url: data.startsWith("data:") ? data : `data:image/jpeg;base64,${data}` } },
                            ],
                        },
                    ],
                    model: "llava-v1.5-7b-4096-preview", // Standard fallback vision
                    max_tokens: 100,
                    temperature: 0.1,
                });

                const content = response.choices[0]?.message?.content?.trim();
                if (content && content.length > 5) {
                    results.push(content);
                    console.log(`✅ Vision Success for ${fileName}: ${content}`);
                    continue; // Success!
                }
            } catch (vErr) {
                // If 404/400, it's a model availability issue — move to text fallback
                if (![404, 400].includes(vErr.status)) throw vErr;
                console.warn(`Vision unavailable (Status ${vErr.status}). Falling back to text analysis for ${fileName}`);
            }

            // --- FALLBACK: Text-based Metadata Analysis (Using Llama 3.3) ---
            const textResponse = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a professional factory inspector. Generate a professional description for a photo based ONLY on its filename and the context of a factory inspection. Be descriptive but concise."
                    },
                    {
                        role: "user",
                        content: `Analyze this filename: "${fileName}". What is this photo likely documenting? 
                        Examples: 'IMG_Label.jpg' -> 'Close-up of product rating plate and labels.'
                        'Factory_A.png' -> 'Overview of the main production floor area.'
                        Return ONLY the description string.`
                    }
                ],
                model: "llama-3.3-70b-versatile",
                max_tokens: 100,
                temperature: 0.5,
            });

            const textDesc = textResponse.choices[0]?.message?.content?.trim() || "Inspection photo.";
            results.push(textDesc.replace(/^["']|["']$/g, ''));
            console.log(`ℹ️ Text Fallback for ${fileName}: ${textDesc}`);

        } catch (err) {
            console.error(`❌ Critical Error for photo ${i + 1}:`, err.message);
            results.push("Inspection photo documentation.");
        }
    }

    return results;
  } catch (error) {
    console.error("Main AI Error:", error);
    return imageObjects.map(() => "Inspection photo.");
  }
};

module.exports = {
  learnFromReport,
  getAISuggestion,
  analyzeVision,
  analyzeIndividualPhotos,
};
