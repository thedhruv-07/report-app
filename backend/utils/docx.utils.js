const { Paragraph, TextRun, TableCell, BorderStyle, VerticalAlign, AlignmentType, WidthType } = require("docx");

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
    align = AlignmentType.CENTER,
    colSpan,
    rowSpan,
    shaded = false,
    color,
    fontSize = 18,
    width,
    verticalAlign = VerticalAlign.CENTER,
    spacing = { before: 20, after: 20 },
    font = "Arial"
  } = options;

  const textRunOptions = {
    text: sanitizeDocxText(text),
    bold,
    size: fontSize,
    font
  };
  if (color) {
    textRunOptions.color = color;
  }

  const paragraphOptions = {
    children: [new TextRun(textRunOptions)],
    alignment: align,
    spacing
  };

  const cellOptions = {
    children: [new Paragraph(paragraphOptions)],
    borders: tableBorders(),
    verticalAlign
  };

  if (width) {
    if (typeof width === "number") {
      cellOptions.width = { size: width, type: WidthType.PERCENTAGE };
    } else {
      cellOptions.width = width;
    }
  }
  if (shaded) {
    cellOptions.shading = { fill: "E9ECEF" };
  }

  if (typeof colSpan === "number" && colSpan > 1) {
    cellOptions.columnSpan = colSpan;
  }

  return new TableCell(cellOptions);
};

module.exports = {
  sanitizeDocxText,
  tableBorders,
  createQtyCell,
};
