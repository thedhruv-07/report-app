export const generateConclusion = (data) => {
  const conclusion = data?.reportHeader?.conclusion || "PENDING";
  return conclusion.toUpperCase();
};

export const getConclusionColor = (conclusion) => {
  const text = (conclusion || "").toUpperCase();
  if (text.includes("PASS")) return "#228B22"; // Green
  if (text.includes("FAIL")) return "#CC0000"; // Red
  return "#F39C12"; // Orange (Pending)
};

export const getPassFailColor = (result) => {
  const text = String(result || "").toLowerCase();
  if (text.includes("pass")) return "#228B22";
  if (text.includes("fail")) return "#CC0000";
  if (text.includes("pending")) return "#F39C12";
  return "#000000";
};

export const blankIfEmpty = (val) => {
  return val === undefined || val === null || String(val).trim() === "" ? "-" : String(val);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  } catch {
    return dateStr;
  }
};
