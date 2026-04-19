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
          model: "llama-3.3-70b-versatile",
          max_tokens: 100,
        });
        const suggestion = completion.choices[0]?.message?.content?.trim() || "";
        // Remove quotes if the AI wraps the suggestion
        return suggestion.replace(/^["']|["']$/g, '');
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

const analyzeVision = async (images) => {
  try {
    if (!groq || !images || !Array.isArray(images) || images.length === 0) return "";

    // Upload images to Wasabi and get signed URLs
    const uploadPromises = images.map(async (img, index) => {
      try {
        let buffer, mimetype, originalname;
        if (img.startsWith("data:")) {
          const [typePart, data] = img.split(",");
          mimetype = typePart.split(":")[1].split(";")[0];
          buffer = Buffer.from(data, "base64");
          originalname = `inspection-image-${index + 1}.jpg`;
        } else {
          // Assume it's base64 without prefix
          buffer = Buffer.from(img, "base64");
          mimetype = "image/jpeg";
          originalname = `inspection-image-${index + 1}.jpg`;
        }
        const file = { buffer, mimetype, originalname };
        const result = await wasabiService.uploadFile(file);
        return { url: result.url, key: result.key };
      } catch (uploadError) {
        console.error(`Upload error for image ${index}:`, uploadError);
        return null;
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    const validResults = uploadResults.filter(r => r !== null);
    const urls = validResults.map(r => r.url);
    const keys = validResults.map(r => r.key);

    if (urls.length === 0) {
      console.error("No images could be uploaded");
      return "";
    }

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Look at these ${urls.length} images from a factory inspection.
            For EACH image, provide a unique, professional description (1 sentence max).
            Format your response exactly like this:
            Description 1: [text]
            Description 2: [text]
            ...
            Focus on technical observations (e.g. 'Overview of machinery', 'Product label details', 'Close-up of wiring').`
          },
          ...urls.map(url => ({
            type: "image_url",
            image_url: {
              url: url,
            },
          }))
        ],
      },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llava-v1.5-7b-4096-preview",
      temperature: 0.5,
      max_tokens: 1024,
    });

    // Clean up uploaded images
    const deletePromises = keys.map(key => wasabiService.deleteFile(key).catch(err => console.error("Delete error:", err)));
    await Promise.all(deletePromises);

    return completion.choices[0]?.message?.content?.trim() || "";
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
