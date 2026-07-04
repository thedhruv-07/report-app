# Product Sheet Extraction — Design

## Problem

Section 3 (Product Information) of the Inspection Notice form requires an admin to
manually type every product row (Order No, Product Name, Item No, Quantity, Unit).
Real supplier product/packing lists (PDF or Word) often contain 10-50+ line items
across many styles and sizes, making manual entry slow and error-prone.

## Goal

Let an admin upload a supplier's product sheet (PDF or Word doc) and have the
Product Information table auto-fill from it, instead of typing every row by hand.

## Scope

- Accepted file types: **PDF and Word (.doc/.docx) only**. Excel/CSV is out of scope
  for this pass.
- The uploaded file is used once to extract data and then **discarded** — it is not
  saved as a permanent attachment on the notice.
- No OCR: scanned/image-only PDFs (no text layer) are not supported; the endpoint
  reports a clear error in that case rather than guessing.

## Architecture

Stateless extraction: the file is parsed and structured in a single request/response
round-trip. Nothing is written to the database by this endpoint. The frontend
appends the returned rows into the notice's existing `productInfo.products` array,
so persistence continues to happen exactly like manually-typed rows (via the
existing Save Draft / Submit Notice flow).

```
Admin picks file (PDF/.doc/.docx)
  → POST /api/inspection-notices/extract-products (multipart, field "file")
    → extractTextFromDocument(buffer, mimetype)
        - PDF      → pdf-parse
        - DOC/DOCX → mammoth
    → extractProductsFromText(rawText)  [ai.service.js, Groq text completion]
        - prompts the model to return ONLY a JSON array
        - one row per SIZE, not per subtotal (see "Row granularity" below)
    → controller validates/cleans the array
  ← { products: [ { orderNo, productName, itemNo, quantity, unit }, ... ] }
Frontend appends `products` to productInfo.products
  (existing totalQuantity auto-calc effect in NoticeTab.jsx recomputes automatically)
```

## Row granularity

Source documents like the sample PDF have one style description (Type / Print /
Trim / Fabric / etc.) per numbered item (S.No.), but multiple sizes under that
item, each with its own quantity — e.g. S.No. 1 has two sizes (4 pcs and 44 pcs).

Extraction produces **one product row per size**, not one row per S.No. subtotal:
the style description becomes `productName` (repeated across each size row under
it), the size/dimension string becomes `itemNo`, and that size's own quantity
becomes `quantity`. This preserves full size-level detail instead of collapsing
it into a single subtotal line.

`orderNo` is left empty unless the AI finds an explicit order/PO number elsewhere
in the document text. `unit` defaults to `"pcs"` unless the source specifies
otherwise (schema allows `pcs | sets | pairs | kg`).

## Components

- **`backend/utils/documentText.util.js`** (new)
  `extractTextFromDocument(buffer, mimetype) → Promise<string>`
  Routes to `pdf-parse` (PDF) or `mammoth` (`.doc`/`.docx`) based on mimetype.
  Throws a clear error for any other mimetype.

- **`backend/services/ai.service.js`** (extend)
  `extractProductsFromText(rawText) → Promise<Array<{orderNo, productName, itemNo, quantity, unit}>>`
  - Truncates input text to ~20,000 characters before sending to Groq (defensive
    cap against unusually large documents; enough for several pages of a
    product/packing list table).
  - Prompts the `llama-3.3-70b-versatile` Groq model (already used elsewhere in
    this file for structured/reasoning tasks) with strict instructions: return
    ONLY a JSON array, one entry per size/line-item, `quantity` as a number,
    `unit` constrained to the same enum as the schema (`pcs|sets|pairs|kg`),
    empty string for any field not found.
  - Parses the response as JSON (stripping markdown code fences if present),
    validates it is an array, coerces/filters malformed entries (drops rows
    missing `productName` or with `quantity <= 0`), caps the result at 300 rows.

- **`backend/controllers/inspectionNotice.controller.js`** (extend)
  `extractProducts(req, res)`:
  - Validates `req.file` exists, mimetype is PDF/DOC/DOCX, size ≤ ~15MB.
  - Calls `extractTextFromDocument`; if resulting text is empty/too short,
    responds 422 with "this file doesn't appear to contain readable text."
  - Calls `extractProductsFromText`; if the resulting array is empty, responds
    422 with "no product rows could be found in this document."
  - On success, responds `200 { products: [...] }`.

- **`backend/routes/inspectionNotice.routes.js`** (extend)
  `router.post("/extract-products", roleCheck(["admin","manager"]), upload.single('file'), inspectionNoticeController.extractProducts)`
  Registered before the `/:id` routes (same reasoning as the existing `/next-id`
  route — an unparameterized path must come first so Express doesn't treat
  "extract-products" as an `:id` value). Reuses the existing multer
  memory-storage middleware (no new middleware needed).

- **`frontend/.../NoticeTab.jsx`** (extend)
  - "Upload Product Sheet" button next to the existing "+ Add Product" button in
    Section 3, accepting `.pdf,.doc,.docx`.
  - On file select: shows a loading state, POSTs the file (multipart,
    `Authorization: Bearer <token>`) to the new endpoint.
  - On success: appends the returned `products` array to
    `formData.productInfo.products` via the existing `updateSection('productInfo', ...)`
    pattern (rows are **appended**, never replacing existing manually-entered rows).
  - On error: shows an inline error message near the button; the table is left
    unchanged.

## Error handling

| Condition | Response |
|---|---|
| No file / unsupported mimetype | 400, rejected before parsing |
| File larger than ~15MB | 400, rejected before parsing |
| No extractable text (e.g. scanned PDF) | 422, "doesn't appear to contain readable text" |
| AI returns empty/invalid JSON | 422, "no product rows could be found" |
| Any of the above, or a network error | Frontend shows the error inline; product table is untouched |

## Testing

No test suite exists in this repo. Verification will be manual: upload the sample
PDF provided, confirm the resulting rows match the source document's per-size
breakdown, confirm a bad/unsupported file produces a clear error and does not
touch the table.
