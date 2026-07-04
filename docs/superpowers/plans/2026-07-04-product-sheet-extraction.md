# Product Sheet Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin upload a supplier's PDF or Word product/packing list on the Inspection Notice form and have the Product Information table (Order No, Product Name, Item No, Quantity, Unit) auto-fill from it, instead of typing every row by hand.

**Architecture:** A new stateless backend endpoint extracts raw text from the uploaded file (`pdf-parse` for PDF, `mammoth` for `.doc`/`.docx`), sends that text to Groq for structured extraction (one JSON row per size/line-item, not per subtotal), validates the result, and returns it. The frontend appends the returned rows into the existing `productInfo.products` array — nothing new is persisted server-side; it flows through the notice's existing Save Draft / Submit Notice path exactly like manually-typed rows.

**Tech Stack:** Node/Express, Mongoose, `pdf-parse` (new dep), `mammoth` (new dep), `groq-sdk` (already used elsewhere in `ai.service.js`), React (NoticeTab.jsx), `docx` (already a dep, reused here only to build test fixtures).

**Reference:** Design spec at `docs/superpowers/specs/2026-07-04-product-sheet-extraction-design.md`.

**No test framework note:** This repo has no test suite configured (see `CLAUDE.md`) and no existing example of mocking Express req/res. Verification below uses small standalone Node scripts with `assert`, following the existing convention in this repo of ad hoc scripts like `backend/check_db.js` and `backend/test_provision.js`. These scripts are kept in the repo afterward for future regression checks, same as those existing files. The final task is a manual, real end-to-end run using `/verify`.

---

### Task 1: Add PDF/DOCX parsing dependencies

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install the packages**

Run:
```bash
cd backend && npm install pdf-parse mammoth
```
Expected: `package.json` and `package-lock.json` gain `pdf-parse` and `mammoth` entries; install completes with no errors.

- [ ] **Step 2: Verify both packages are importable**

Run:
```bash
node -e "require('pdf-parse'); require('mammoth'); console.log('OK: both modules load')"
```
(run from the `backend/` directory)

Expected output: `OK: both modules load`

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add pdf-parse and mammoth for product sheet extraction"
```

---

### Task 2: Document text extraction util

**Files:**
- Create: `backend/utils/documentText.util.js`
- Create: `backend/verify_document_extraction.js`

- [ ] **Step 1: Write the verification script (will fail — the util doesn't exist yet)**

Create `backend/verify_document_extraction.js`:

```js
const assert = require('assert');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { extractTextFromDocument } = require('./utils/documentText.util');

async function run() {
  // Build a real, minimal .docx in memory using the same `docx` lib the app
  // already depends on for report generation — this gives mammoth a genuine
  // OOXML file to parse, not a hand-rolled fixture.
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun('Order No: PO-100')] }),
        new Paragraph({ children: [new TextRun('Product Name: Test Widget')] }),
        new Paragraph({ children: [new TextRun('Item No: TW-1')] }),
        new Paragraph({ children: [new TextRun('Quantity: 25 pcs')] }),
      ],
    }],
  });
  const buffer = await Packer.toBuffer(doc);

  const text = await extractTextFromDocument(
    buffer,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  assert(text.includes('Test Widget'), 'Expected extracted text to include "Test Widget"');
  assert(text.includes('PO-100'), 'Expected extracted text to include "PO-100"');
  console.log('PASS: documentText.util.js correctly extracts text from a .docx buffer');

  // Unsupported mimetype should throw, not silently return garbage
  let threw = false;
  try {
    await extractTextFromDocument(Buffer.from('irrelevant'), 'image/png');
  } catch {
    threw = true;
  }
  assert(threw, 'Expected extractTextFromDocument to throw for an unsupported mimetype');
  console.log('PASS: unsupported mimetype is rejected');
}

run().catch(err => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node backend/verify_document_extraction.js`
Expected: FAIL — `Cannot find module './utils/documentText.util'`

- [ ] **Step 3: Implement the util**

Create `backend/utils/documentText.util.js`:

```js
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const PDF_MIMETYPES = ['application/pdf'];
const DOCX_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

/**
 * Extracts plain text from a PDF or Word document buffer.
 * Throws for any other mimetype.
 */
async function extractTextFromDocument(buffer, mimetype) {
  if (PDF_MIMETYPES.includes(mimetype)) {
    const result = await pdfParse(buffer);
    return result.text || '';
  }
  if (DOCX_MIMETYPES.includes(mimetype)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error(`Unsupported file type: ${mimetype}. Only PDF and Word documents are supported.`);
}

module.exports = { extractTextFromDocument };
```

- [ ] **Step 4: Run the verification script again and confirm it passes**

Run: `node backend/verify_document_extraction.js`
Expected:
```
PASS: documentText.util.js correctly extracts text from a .docx buffer
PASS: unsupported mimetype is rejected
```

- [ ] **Step 5: Commit**

```bash
git add backend/utils/documentText.util.js backend/verify_document_extraction.js
git commit -m "feat: add PDF/DOCX text extraction util for product sheet uploads"
```

---

### Task 3: AI product extraction from raw text

**Files:**
- Modify: `backend/services/ai.service.js`
- Create: `backend/verify_extract_products.js`

- [ ] **Step 1: Write the verification script (will fail — the function doesn't exist yet)**

Create `backend/verify_extract_products.js`. The sample text below is the real text
of page 1 of the supplier PDF this feature was designed against (items 1–3, each
with multiple sizes and its own subtotal):

```js
const assert = require('assert');
const { extractProductsFromText } = require('./services/ai.service');

const SAMPLE_TEXT = `
S.No. Image Description Size (in inch) Quantity Rate in USD/PC Total
1
Type: Gathered Pleat Empire
Print: None
Trim: Self
Holder: Spider
Fabric: Linen (Option #1 as per approved fabric)
Frame Colour: Brass
Note: Clip fitting for 6" size; thicker lining
10.5" x 16" x 10.5" 4
11" x 18" x 12" 44
Subtotal 48

2
Type: Box Pleat Empire
Print: None
Trim: Self
Holder: Spider
Fabric: Linen (Option #1 as per approved fabric)
Frame Colour: Brass
Note: Clip fitting for 6" size; thicker lining
10.5" x 16" x 10.5" 4
11" x 18" x 12" 10
12" x 20" x 13" 4
Subtotal 18

3
Type: Gathered Pleat Empire
Print: Custom Print
Trim: Self
Holder: Spider
Fabric: Cotton
Frame Colour: Brass
Note: Buyer to provide. Clip fitting for 6" size; thicker lining
12" x 20" x 13" 2
Subtotal 2
`;

async function run() {
  const products = await extractProductsFromText(SAMPLE_TEXT);

  assert(Array.isArray(products), 'Expected an array result');
  assert(products.length >= 5, `Expected at least 5 rows (one per size across 3 items), got ${products.length}`);

  const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
  assert.strictEqual(totalQty, 68, `Expected total quantity 68 (48+18+2), got ${totalQty}`);

  products.forEach(p => {
    assert(typeof p.productName === 'string' && p.productName.length > 0, 'Every row must have a non-empty productName');
    assert(['pcs', 'sets', 'pairs', 'kg'].includes(p.unit), `Invalid unit: ${p.unit}`);
    assert(typeof p.quantity === 'number' && p.quantity > 0, `Invalid quantity: ${p.quantity}`);
  });

  console.log(`PASS: extractProductsFromText produced ${products.length} rows totalling ${totalQty} units`);
  console.log(JSON.stringify(products, null, 2));
}

run().catch(err => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node backend/verify_extract_products.js`
Expected: FAIL — `extractProductsFromText is not a function` (or similar, since it isn't exported yet)

- [ ] **Step 3: Implement `extractProductsFromText`**

In `backend/services/ai.service.js`, add near the top (after the existing `groq` client setup, before `learnFromReport`):

```js
const MAX_EXTRACT_TEXT_LENGTH = 20000;
const MAX_EXTRACTED_PRODUCTS = 300;
const VALID_PRODUCT_UNITS = ['pcs', 'sets', 'pairs', 'kg'];
```

Then add the function itself (place it after `analyzeIndividualPhotos`, before `module.exports`):

```js
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
```

Finally, update the `module.exports` block at the bottom of the file to include the new function:

```js
module.exports = {
  learnFromReport,
  getAISuggestion,
  analyzeVision,
  analyzeIndividualPhotos,
  extractProductsFromText,
};
```

- [ ] **Step 4: Run the verification script again and confirm it passes**

Requires `GROQ_API_KEY` to be set in `backend/.env` (same requirement as the rest of the AI features in this app).

Run: `node backend/verify_extract_products.js`
Expected: a `PASS: extractProductsFromText produced N rows totalling 68 units` line followed by the printed JSON array. If it fails on the total-quantity assertion, inspect the printed JSON — the AI may have mis-grouped a row; adjust the prompt wording (e.g. emphasize "each size on its own line has its own quantity, sum all quantities exactly as given") and re-run until stable.

- [ ] **Step 5: Commit**

```bash
git add backend/services/ai.service.js backend/verify_extract_products.js
git commit -m "feat: add AI-based product list extraction from document text"
```

---

### Task 4: Controller endpoint

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`
- Create: `backend/verify_extract_products_controller.js`

- [ ] **Step 1: Write the verification script (will fail — the handler doesn't exist yet)**

Create `backend/verify_extract_products_controller.js`:

```js
const assert = require('assert');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { extractProducts } = require('./controllers/inspectionNotice.controller');

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

async function run() {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun('Type: Gathered Pleat Empire, Fabric: Linen')] }),
        new Paragraph({ children: [new TextRun('10.5 x 16 x 10.5 Quantity 4')] }),
        new Paragraph({ children: [new TextRun('11 x 18 x 12 Quantity 44')] }),
      ],
    }],
  });
  const buffer = await Packer.toBuffer(doc);

  // Happy path: valid .docx buffer
  const res1 = makeRes();
  await extractProducts({
    file: {
      buffer,
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.length,
    },
  }, res1);
  assert.strictEqual(res1.statusCode, 200, `Expected 200, got ${res1.statusCode}: ${JSON.stringify(res1.body)}`);
  assert(Array.isArray(res1.body.products), 'Expected body.products to be an array');
  assert(res1.body.products.length > 0, 'Expected at least one extracted product');
  console.log('PASS: extractProducts controller returned', res1.body.products.length, 'products for a valid .docx');

  // Unsupported mimetype
  const res2 = makeRes();
  await extractProducts({ file: { buffer: Buffer.from('x'), mimetype: 'image/png', size: 1 } }, res2);
  assert.strictEqual(res2.statusCode, 400, `Expected 400 for unsupported mimetype, got ${res2.statusCode}`);
  console.log('PASS: unsupported mimetype rejected with 400');

  // No file at all
  const res3 = makeRes();
  await extractProducts({}, res3);
  assert.strictEqual(res3.statusCode, 400, `Expected 400 for missing file, got ${res3.statusCode}`);
  console.log('PASS: missing file rejected with 400');

  // Oversized file
  const res4 = makeRes();
  await extractProducts({
    file: { buffer: Buffer.alloc(10), mimetype: 'application/pdf', size: 16 * 1024 * 1024 },
  }, res4);
  assert.strictEqual(res4.statusCode, 400, `Expected 400 for oversized file, got ${res4.statusCode}`);
  console.log('PASS: oversized file rejected with 400');
}

run().catch(err => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node backend/verify_extract_products_controller.js`
Expected: FAIL — `extractProducts is not a function`

- [ ] **Step 3: Implement the controller handler**

In `backend/controllers/inspectionNotice.controller.js`, add to the top imports:

```js
const { extractTextFromDocument } = require("../utils/documentText.util");
```

(the `extractProductsFromText` function is already reachable via the existing pattern of requiring `ai.service.js` — add this import alongside the other top-level `require`s):

```js
const { extractProductsFromText } = require("../services/ai.service");
```

Then add the handler itself (place it near `getNextNoticeId`, since both are small utility-style endpoints):

```js
const ALLOWED_EXTRACT_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_EXTRACT_FILE_SIZE = 15 * 1024 * 1024; // 15MB

exports.extractProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    if (!ALLOWED_EXTRACT_MIMETYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF or Word document." });
    }
    if (req.file.size > MAX_EXTRACT_FILE_SIZE) {
      return res.status(400).json({ error: "File is too large. Maximum size is 15MB." });
    }

    const text = await extractTextFromDocument(req.file.buffer, req.file.mimetype);
    if (!text || text.trim().length < 20) {
      return res.status(422).json({ error: "This file doesn't appear to contain readable text (it may be a scanned image). Please fill products manually." });
    }

    const products = await extractProductsFromText(text);
    if (!products.length) {
      return res.status(422).json({ error: "No product rows could be found in this document." });
    }

    res.json({ products });
  } catch (error) {
    console.error("Error extracting products:", error);
    res.status(500).json({ error: "Failed to extract products from the document.", details: error.message });
  }
};
```

- [ ] **Step 4: Run the verification script again and confirm it passes**

Run: `node backend/verify_extract_products_controller.js`
Expected:
```
PASS: extractProducts controller returned N products for a valid .docx
PASS: unsupported mimetype rejected with 400
PASS: missing file rejected with 400
PASS: oversized file rejected with 400
```

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/verify_extract_products_controller.js
git commit -m "feat: add extractProducts controller endpoint"
```

---

### Task 5: Route registration

**Files:**
- Modify: `backend/routes/inspectionNotice.routes.js`

- [ ] **Step 1: Add the route**

In `backend/routes/inspectionNotice.routes.js`, the file already imports `upload` from `../middleware/upload.middleware` and has a `/next-id` route registered before the `/:id` route. Add the new route in the same place, right after `/next-id`:

```js
router.get("/next-id", inspectionNoticeController.getNextNoticeId);
router.post("/extract-products", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.extractProducts);
router.get("/:id", inspectionNoticeController.getNoticeById);
```

(Only the middle line is new — it must stay before `/:id` or Express will try to match `"extract-products"` as an `:id` value.)

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `node -c backend/routes/inspectionNotice.routes.js`
Expected: no output (clean exit)

- [ ] **Step 3: Verify route ordering**

Run:
```bash
grep -n "extract-products\|/:id" backend/routes/inspectionNotice.routes.js
```
Expected: the `extract-products` line appears BEFORE the `/:id` line in the output.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/inspectionNotice.routes.js
git commit -m "feat: register POST /api/inspection-notices/extract-products route"
```

---

### Task 6: Frontend upload button

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add the `Upload` icon to the existing lucide-react import**

Find (near the top of the file):
```js
import { Plus, X, ExternalLink, Calculator, Download } from 'lucide-react';
```
Replace with:
```js
import { Plus, X, ExternalLink, Calculator, Download, Upload } from 'lucide-react';
```

- [ ] **Step 2: Add extraction status state**

Find:
```js
  // Rows toggled into "type a name manually" mode — for third-party inspectors
  // who aren't registered platform users and won't appear in the dropdown.
  const [manualInspectorRows, setManualInspectorRows] = useState(() => new Set());
```
Add right after it:
```js
  // null while idle, 'loading' while a product sheet is being parsed,
  // { error } if the last upload failed
  const [productExtractStatus, setProductExtractStatus] = useState(null);
```

- [ ] **Step 3: Add the upload handler**

Find the end of `handleAttachmentDelete` (it's defined right after `handleAttachmentUpload`). Add this new function immediately after `updateArrayItem` and before `handleAttachmentUpload` (i.e. right after the closing brace of `updateArrayItem` at line ~156):

```js
  const handleProductSheetUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file later
    if (!file) return;

    setProductExtractStatus('loading');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/extract-products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setProductExtractStatus({ error: data.error || 'Failed to extract products from this file.' });
        return;
      }
      const existing = formData.productInfo?.products || [];
      updateSection('productInfo', { products: [...existing, ...data.products] });
      setProductExtractStatus(null);
    } catch {
      setProductExtractStatus({ error: 'Network error while uploading the file.' });
    }
  };
```

- [ ] **Step 4: Add the button next to "+ Add Product"**

Find:
```jsx
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={() => addArrayItem('productInfo', 'products', { orderNo: '', productName: '', itemNo: '', quantity: 0, unit: 'pcs' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
```
Replace with:
```jsx
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => addArrayItem('productInfo', 'products', { orderNo: '', productName: '', itemNo: '', quantity: 0, unit: 'pcs' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>

            <label className={`px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              productExtractStatus === 'loading' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'text-[#6C47FF] hover:bg-purple-50'
            }`}>
              <Upload className="w-4 h-4" />
              {productExtractStatus === 'loading' ? 'Extracting…' : 'Upload Product Sheet'}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={productExtractStatus === 'loading'}
                onChange={handleProductSheetUpload}
              />
            </label>

            {productExtractStatus?.error && (
              <span className="text-xs font-semibold text-rose-600">{productExtractStatus.error}</span>
            )}
          </div>
```

- [ ] **Step 5: Lint the file**

Run:
```bash
cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
```
Expected: no output (clean)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: add Upload Product Sheet button to Product Information section"
```

---

### Task 7: Manual end-to-end verification

This is a real product/packing list PDF/DOCX with actual images and formatting —
worth confirming the whole path works against a real file, not just the
synthetic fixtures used in Tasks 2–4.

- [ ] **Step 1: Start the app**

Use the `/run` skill (or `npm run dev:all` from the repo root) to start backend + frontend.

- [ ] **Step 2: Navigate to a new Inspection Notice**

Log in as an admin, go to Inspection Notices → New Notice → Section 3: Product Information.

- [ ] **Step 3: Upload a real supplier PDF**

Click "Upload Product Sheet", select a real multi-item PDF product/packing list (e.g. the sample document this feature was designed against). Confirm:
- The button shows "Extracting…" while the request is in flight.
- On success, new rows appear in the Product Information table — one row per size, not per style subtotal.
- "Sum of product quantities" below the table updates to reflect the newly appended rows.
- Existing rows (if any were typed manually beforehand) are still present — nothing was wiped.

- [ ] **Step 4: Confirm error handling with a bad file**

Try uploading an unsupported file type (e.g. a `.jpg`). Confirm an inline red error message appears near the button and the product table is unchanged.

- [ ] **Step 5: Save and confirm persistence**

Click "Save Draft". Reload the page (or navigate away and back to the same notice). Confirm the extracted rows are still present, exactly like manually-typed rows would be.

No commit for this task — it's verification only, not a code change.

---

## Plan self-review notes

- **Spec coverage:** file types (PDF+Word, Task 1/2), stateless extraction with no attachment storage (Task 4 — nothing writes to Wasabi or the DB), one-row-per-size (Task 3, enforced by prompt + verified against real sample text), append-not-replace (Task 6, `[...existing, ...data.products]`), route ordering before `/:id` (Task 5), error handling table from the spec (Task 4 covers all four rows: bad mimetype, oversized, unreadable text, empty AI result).
- **Type consistency:** the product row shape `{ orderNo, productName, itemNo, quantity, unit }` is used identically in Task 3 (AI function output), Task 4 (controller pass-through), and Task 6 (frontend append) — matches the pre-existing shape already used by the "+ Add Product" button (`orderNo: '', productName: '', itemNo: '', quantity: 0, unit: 'pcs'`).
