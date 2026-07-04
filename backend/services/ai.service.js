const fs = require("fs");
const Groq = require("groq-sdk");
const { MEMORY_PATH, GROQ_API_KEY } = require("../config/config");

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const MAX_EXTRACT_TEXT_LENGTH = 20000;
const MAX_EXTRACTED_PRODUCTS = 300;
const VALID_PRODUCT_UNITS = ['pcs', 'sets', 'pairs', 'kg'];

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

const buildSystemPrompt = (reportMeta = {}) => {
  const parts = ["You are a professional factory inspection report assistant."];
  const { inspectionType, product, client, factory, inspectionDate } = reportMeta;
  if (inspectionType || product || client || factory) {
    const details = [
      inspectionType && `Inspection type: ${inspectionType}`,
      product        && `Product: ${product}`,
      client         && `Client: ${client}`,
      factory        && `Factory: ${factory}`,
      inspectionDate && `Date: ${inspectionDate}`,
    ].filter(Boolean).join('. ');
    parts.push(`Current inspection — ${details}.`);
    parts.push("All remarks must be specific to this product and inspection context.");
  }
  parts.push("Reply with ONLY the requested text — one sentence, no preamble, no lists, no examples.");
  return parts.join(' ');
};

const getAISuggestion = async (context, partialText = "", photos = [], reportMeta = {}) => {
  try {
    if (!groq) return "";

    // --- Photo-aware suggestion (vision model) ---
    if (photos && photos.length > 0) {
      const imageContents = photos.slice(0, 3).map(p => ({
        type: "image_url",
        image_url: { url: p.startsWith("data:") ? p : `data:image/jpeg;base64,${p}` }
      }));

      const { product, client, factory } = reportMeta;
      const metaHint = [product, client && `for ${client}`, factory && `at ${factory}`].filter(Boolean).join(' ');
      const prompt = partialText
        ? `Based on these inspection photos${metaHint ? ` of ${metaHint}` : ''}, continue this remark in ONE sentence: "${partialText}". Output ONLY the continuation.`
        : `Look at these inspection photos${metaHint ? ` of ${metaHint}` : ''} and write ONE professional observation remark describing what you see. Output ONLY the single sentence.`;

      try {
        const response = await groq.chat.completions.create({
          messages: [{
            role: "user",
            content: [{ type: "text", text: prompt }, ...imageContents]
          }],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 100,
          temperature: 0.3,
        });
        const suggestion = response.choices[0]?.message?.content?.trim() || "";
        return suggestion.replace(/^["']|["']$/g, '');
      } catch (e) {
        console.warn("Vision suggestion failed, falling back to text:", e.message);
      }
    }

    // --- Text-only suggestion ---
    // 1. Local memory match (only when user has typed something)
    if (partialText) {
      const localMatch = localMemoryCache.find(m => m.toLowerCase().startsWith(partialText.toLowerCase()));
      if (localMatch && typeof localMatch === "string") return localMatch.slice(partialText.length);
    }

    // 2. Groq text model with grounded context
    try {
      const systemPrompt = buildSystemPrompt(reportMeta);
      const { product, client, factory } = reportMeta;
      const metaHint = [product, client && `for ${client}`, factory && `at ${factory}`].filter(Boolean).join(' ');
      const fullContext = [context, metaHint].filter(Boolean).join(' — ');

      const prompt = partialText
        ? `Continue this inspection remark in ONE sentence only. Text so far: "${partialText}". Output ONLY the continuation text, nothing else.`
        : `Write ONE professional inspection remark about: "${fullContext}". Output ONLY the single sentence, no intro, no numbering, no explanation.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: 80,
      });
      const suggestion = completion.choices[0]?.message?.content?.trim() || "";
      return suggestion.replace(/^["']|["']$/g, '');
    } catch (e) {
      console.error("Groq text suggestion error:", e);
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

    console.log(`📸 Analyzing ${imageObjects.length} photos in parallel...`);

    const tasks = imageObjects.map(async (img, i) => {
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
    });

    return await Promise.all(tasks);
  } catch (error) {
    console.error("Main AI Error:", error);
    return imageObjects.map(() => "Inspection photo.");
  }
};

/**
 * Extracts a structured product/packing list from raw document text using Groq.
 * Returns one row per SIZE/line-item (not per subtotal) — a style with multiple
 * sizes produces multiple rows, each with its own quantity.
 */
const extractProductsFromText = async (rawText) => {
  try {
    if (!groq || !rawText || !rawText.trim()) return [];

    const truncated = rawText.slice(0, MAX_EXTRACT_TEXT_LENGTH);

    const prompt = `You are extracting a product/packing list table from a purchase order or product specification document for a factory inspection company.

Below is the raw text of the document. It may describe several styles/items, each with one or more sizes, and each size has its own quantity.

Return ONLY a JSON array (no prose, no markdown fences, no explanation). Each element must be an object with exactly these keys:
- "orderNo": string — an order/PO number if one is explicitly mentioned for that line, otherwise ""
- "productName": string — a short name/description of the style (e.g. combine type + fabric/material), reused for every size under that style
- "itemNo": string — the size/dimension or item code for that specific line (e.g. "10.5 x 16 x 10.5")
- "quantity": number — the quantity for THIS specific size/line, not a subtotal
- "unit": string — one of "pcs", "sets", "pairs", "kg" (default "pcs" if not specified)

Critical rule: each size/dimension line has its OWN quantity — treat every "<size> <number>" line under a style as a separate output row with that exact number as its quantity. Do NOT output the "Subtotal" line as a row, and do NOT sum sizes together into one row — the subtotal is only provided for you to sanity-check that the quantities you extract for that style add up to it, not something to output itself. Sum all the quantities you extract exactly as given in the source text — do not round, estimate, or invent values.

If a style has multiple sizes, output one array element per size — do not collapse them into a single subtotal row.

Document text:
"""
${truncated}
"""`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise data-extraction assistant. You only ever respond with a single valid JSON array and nothing else." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("extractProductsFromText: failed to parse AI response as JSON:", parseErr.message);
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(row => ({
        orderNo: typeof row.orderNo === 'string' ? row.orderNo : '',
        productName: typeof row.productName === 'string' ? row.productName.trim() : '',
        itemNo: typeof row.itemNo === 'string' ? row.itemNo : '',
        quantity: Number(row.quantity) || 0,
        unit: VALID_PRODUCT_UNITS.includes(row.unit) ? row.unit : 'pcs',
      }))
      .filter(row => row.productName && row.quantity > 0)
      .slice(0, MAX_EXTRACTED_PRODUCTS);
  } catch (error) {
    console.error("extractProductsFromText error:", error);
    return [];
  }
};

const VALID_SAMPLE_STATUSES = ['Available', 'Returned', 'Consumed', 'Damaged'];

/**
 * Extracts a structured customer-samples list from raw document text using Groq.
 * Returns one row per sample/item entry found in the source document.
 */
const extractSamplesFromText = async (rawText) => {
  try {
    if (!groq || !rawText || !rawText.trim()) return [];

    const truncated = rawText.slice(0, MAX_EXTRACT_TEXT_LENGTH);

    const prompt = `You are extracting a customer samples log from a document for a factory inspection company. Customer samples are reference items (e.g. approved fabric swatches, color standards, physical prototypes) that the client provided for comparison during inspection.

Return ONLY a JSON array (no prose, no markdown fences, no explanation). Each element must be an object with exactly these keys:
- "serialNo": string — a serial/reference number for the sample if mentioned, otherwise ""
- "itemNo": string — an item/SKU code if mentioned, otherwise ""
- "name": string — a short name/description of the sample (e.g. "Approved fabric swatch - Linen")
- "quantity": number — how many of this sample were provided (default 1 if not stated)
- "storageLocation": string — where the sample is stored/kept, if mentioned, otherwise ""
- "status": string — one of "Available", "Returned", "Consumed", "Damaged" (default "Available" if not specified)

Document text:
"""
${truncated}
"""`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise data-extraction assistant. You only ever respond with a single valid JSON array and nothing else." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("extractSamplesFromText: failed to parse AI response as JSON:", parseErr.message);
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(row => ({
        serialNo: typeof row.serialNo === 'string' ? row.serialNo : '',
        itemNo: typeof row.itemNo === 'string' ? row.itemNo : '',
        name: typeof row.name === 'string' ? row.name.trim() : '',
        quantity: Number(row.quantity) || 1,
        storageLocation: typeof row.storageLocation === 'string' ? row.storageLocation : '',
        status: VALID_SAMPLE_STATUSES.includes(row.status) ? row.status : 'Available',
      }))
      .filter(row => row.name)
      .slice(0, MAX_EXTRACTED_PRODUCTS);
  } catch (error) {
    console.error("extractSamplesFromText error:", error);
    return [];
  }
};

module.exports = {
  learnFromReport,
  getAISuggestion,
  analyzeVision,
  analyzeIndividualPhotos,
  extractProductsFromText,
  extractSamplesFromText,
};

