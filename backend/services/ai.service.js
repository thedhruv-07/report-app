const fs = require("fs");
const Groq = require("groq-sdk");
const pLimit = require("p-limit");
const { MEMORY_PATH, GROQ_API_KEY } = require("../config/config");

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// In-memory cache for learning to avoid blocking sync file I/O
let localMemoryCache = [];
try {
  if (fs.existsSync(MEMORY_PATH)) {
    localMemoryCache = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8"));
  }
} catch (e) {
  console.error("Failed to load AI memory:", e);
}

const learnFromReport = (data) => {
  try {
    const newEntries = [];
    if (Array.isArray(data.remarks)) {
      data.remarks.forEach(r => { if (typeof r === "string" && r.trim().length > 10) newEntries.push(r.trim()); });
    }

    if (typeof data.recommendationText === "string" && data.recommendationText.trim().length > 10) {
      newEntries.push(data.recommendationText.trim());
    }
    localMemoryCache = Array.from(new Set([...localMemoryCache, ...newEntries])).slice(-1000);
    // Background write to keep cache in sync with disk without blocking
    fs.writeFile(MEMORY_PATH, JSON.stringify(localMemoryCache, null, 2), () => {});
  } catch (e) { console.error("Local Learning Error:", e); }
};

const getAISuggestion = async (context, partialText = "") => {
  try {
    // 1. Local Memory Match (using cache)
    if (partialText) {
      const localMatch = localMemoryCache.find(m => m.toLowerCase().startsWith(partialText.toLowerCase()));
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

    console.log(`📸 Analyzing ${imageObjects.length} photos with parallel processing (limit 3)...`);
    const limit = pLimit(3); // Process 3 photos at a time to avoid timeouts and rate limits

    const tasks = imageObjects.map((img, i) => limit(async () => {
      const { data, fileName } = img;
      try {
        // --- LAYER 1: TRUE VISION ANALYSIS (Llama 4 Scout) ---
        try {
          const response = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: [
                  { 
                    type: "text", 
                    text: "Describe exactly what is shown in this inspection photo in one professional, technical sentence. Focus on the physical item or document visible. No conversational filler." 
                  },
                  { 
                    type: "image_url", 
                    image_url: { url: data.startsWith("data:") ? data : `data:image/jpeg;base64,${data}` } 
                  },
                ],
              },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            max_tokens: 150,
            temperature: 0.2,
          });

          const content = response.choices[0]?.message?.content?.trim();
          if (content && content.length > 5) return content;
        } catch (vErr) {
          console.warn(`Vision AI (Llama 4) failed for ${fileName}: ${vErr.message}`);
        }

        // --- LAYER 2: SMART METADATA FALLBACK (Llama 3.3) ---
        const textResponse = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional factory inspector. Generate a professional description for a photo based on its filename and the context of a factory inspection. Be descriptive but concise."
            },
            {
              role: "user",
              content: `Analyze this filename: "${fileName}". What is this photo documenting? Return ONLY the description.`
            }
          ],
          model: "llama-3.3-70b-versatile",
          max_tokens: 100,
          temperature: 0.5,
        });

        const textDesc = textResponse.choices[0]?.message?.content?.trim() || "Inspection photo.";
        return textDesc.replace(/^["']|["']$/g, '');
      } catch (err) {
        console.error(`❌ Error for photo ${i}:`, err.message);
        return "Inspection photo documentation.";
      }
    }));

    return await Promise.all(tasks);
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

