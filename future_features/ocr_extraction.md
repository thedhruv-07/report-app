# AI Document Extraction Feature (OCR)

This file contains the preserved code for the AI Document Auto-fill feature using Google Gemini Vision. 

## 1. Backend Endpoint (Express)

```javascript
// server.js
app.post("/api/ocr", async (req, res) => {
  try {
    if (!genAI) throw new Error("Gemini API key missing. Please set GEMINI_API_KEY in .env");
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) throw new Error("No image data provided");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a data extraction assistant. I will provide an image of a purchase order or packing list. Extract exactly the following fields: servicePerformed, client, supplier, factory, productName, po, itemNo, country. Return ONLY a valid JSON object with these exact keys. Do not return markdown blocks like \`\`\`json. If a field is not found, leave it as an empty string.`;
    
    const imageParts = [
      {
        inlineData: {
          data: imageBase64.replace(/^data:(image|application)\/\w+;base64,/, ""),
          mimeType: mimeType || "image/jpeg"
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

## 2. Frontend Component (GeneralInfo.jsx)

### State and Logic
```javascript
const [isAiProcessing, setIsAiProcessing] = useState(false);

const handleAiAutoFill = async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  setIsAiProcessing(true);

  try {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: reader.result, mimeType: file.type })
        });
        const data = await response.json();
        if (data && typeof data === 'object' && !data.error) {
          if (setForm) {
            setForm(prev => ({
               ...prev,
               ...data // matches form field names
            }));
          }
        } else if (data.error) {
          alert("AI extraction failed: " + data.error);
        }
      } catch (err) {
        alert("Network error contacting AI");
      }
      setIsAiProcessing(false);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    setIsAiProcessing(false);
  }
};
```

### UI Section
```javascript
<div style={{
  marginBottom: "20px",
  padding: "16px",
  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)",
  border: `2px dashed ${colors.primary}`,
  borderRadius: "12px",
  textAlign: "center"
}}>
  <h4 style={{ margin: "0 0 8px 0", color: colors.primary, fontSize: "16px" }}>
    ✨ AI Document Auto-Fill
  </h4>
  <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: colors.textMuted }}>
    Upload a Packing List or P.O. (Image/PDF) to instantly extract text into the form!
  </p>
  <label style={{
    display: "inline-block",
    padding: "10px 20px",
    background: colors.primary,
    color: "#fff",
    borderRadius: "8px",
    cursor: isAiProcessing ? "not-allowed" : "pointer",
    fontWeight: "bold",
    fontSize: "13px",
    opacity: isAiProcessing ? 0.7 : 1,
    transition: "all 0.2s"
  }}>
    {isAiProcessing ? "✨ Analyzing Document..." : "Upload Document"}
    <input 
      type="file" 
      accept="image/*,application/pdf"
      style={{ display: "none" }} 
      onChange={handleAiAutoFill} 
      disabled={isAiProcessing}
    />
  </label>
</div>
```
