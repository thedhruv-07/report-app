const { PDFParse } = require('pdf-parse');
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
    // pdf-parse v2 replaced the old callable-function API with a class.
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      await parser.destroy();
    }
  }
  if (DOCX_MIMETYPES.includes(mimetype)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error(`Unsupported file type: ${mimetype}. Only PDF and Word documents are supported.`);
}

module.exports = { extractTextFromDocument };
