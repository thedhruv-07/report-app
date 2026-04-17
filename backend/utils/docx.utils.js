const { Paragraph, TextRun, TableCell, BorderStyle } = require("docx");

const sanitizeDocxText = (value) => {
  const str = String(value ?? "");
  return str.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, "");
};

const tableBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
});

const createQtyCell = (text, options = {}) => {
  const {
    bold = false,
    align = "center",
    colSpan,
    rowSpan,
    shaded = false,
    color,
    fontSize = 18,
    width,
  } = options;

  const textRunOptions = {
    text: sanitizeDocxText(text),
    bold,
    size: fontSize,
  };
  if (color) {
    textRunOptions.color = color;
  }

  const paragraphOptions = {
    children: [new TextRun(textRunOptions)],
    alignment: align,
  };

  const cellOptions = {
    children: [new Paragraph(paragraphOptions)],
    width,
    borders: tableBorders(),
  };
  if (shaded) {
    cellOptions.shading = { fill: "E9ECEF" };
  }

  if (typeof colSpan === "number" && colSpan > 1) {
    cellOptions.columnSpan = colSpan;
  }

  if (typeof rowSpan === "number" && rowSpan > 1) {
    cellOptions.rowSpan = rowSpan;
  }

  return new TableCell(cellOptions);
};

const getImageTypeFromMime = (mime) => {
  if (!mime || typeof mime !== "string") return null;
  const normalized = mime.toLowerCase().trim();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("bmp")) return "bmp";
  return null;
};

const getImageTypeFromDataUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext === "jpg" || ext === "png" || ext === "gif" || ext === "bmp") return ext;
  return null;
};

const detectImageTypeFromBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) return "png";
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) return "gif";
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return "bmp";
  return null;
};

const isSupportedImageBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  const hasPngHeader =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const hasJpegHeader = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const hasGifHeader =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61;

  const hasBmpHeader = buffer[0] === 0x42 && buffer[1] === 0x4d;

  if (hasJpegHeader) {
    return buffer.length > 4 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  }

  if (hasPngHeader) {
    const iendTrailer = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
    return buffer.indexOf(iendTrailer) !== -1;
  }

  if (hasGifHeader) {
    return buffer.length > 14 && buffer[buffer.length - 1] === 0x3b;
  }

  if (hasBmpHeader) {
    if (buffer.length < 6) return false;
    const declaredSize = buffer.readUInt32LE(2);
    return declaredSize > 0 && declaredSize <= buffer.length;
  }

  return false;
};

module.exports = {
  sanitizeDocxText,
  tableBorders,
  createQtyCell,
  getImageTypeFromMime,
  getImageTypeFromDataUrl,
  detectImageTypeFromBuffer,
  isSupportedImageBuffer,
};
