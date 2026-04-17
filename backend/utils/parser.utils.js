const safeJsonParse = (val, fallback = []) => {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
};

const normalizePayload = (body) => {
  const parsed = {};
  Object.keys(body || {}).forEach((key) => {
    const value = body[key];
    if (typeof value !== "string") {
      parsed[key] = value;
      return;
    }

    const trimmed = value.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        parsed[key] = JSON.parse(trimmed);
        return;
      } catch (e) {}
    }

    parsed[key] = value;
  });

  return parsed;
};

const pickFirstValue = (data, keys, fallback = "") => {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
};

const normalizeReportDate = (value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const iso = parsed.toISOString();
      return iso ? iso.slice(0, 10) : String(value).trim();
    }
    return value.trim();
  }

  const now = new Date().toISOString();
  return now ? now.slice(0, 10) : "";
};

const normalizeConclusionValue = (value) => {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();

  if (normalized === "PASS") return "PASSED";
  if (normalized === "FAIL") return "FAILED";
  if (normalized === "PASSED" || normalized === "FAILED" || normalized === "PENDING") {
    return normalized;
  }

  return "";
};

const inferConclusionFromSummary = (data) => {
  const summaryStatuses = [
    data.quantity,
    data.workmanship,
    data.onSiteTests,
    data.dimensions,
    data.packingResult,
    data.packing_result,
    data.marking_result_final,
    data.client_requirement_result,
    data.quantityResult,
    data.workmanshipResult,
    data.onSiteTestResult,
    data.productResult,
  ]
    .map((value) => normalizeConclusionValue(String(value || "")))
    .filter(Boolean);

  if (summaryStatuses.includes("FAILED")) return "FAILED";
  if (summaryStatuses.includes("PENDING")) return "PENDING";
  if (summaryStatuses.includes("PASSED")) return "PASSED";
  return "";
};

const enrichReportHeaderData = (rawData) => {
  const data = rawData || {};

  const client = pickFirstValue(data, ["client", "clientName", "clientAbbr", "buyer"], "-");
  const po = pickFirstValue(data, ["po", "frin", "poNo", "poNumber", "purchaseOrder"], "-");

  const inspectionNumber = pickFirstValue(
    data,
    [
      "inspectionNumber",
      "inspectionNo",
      "inspectionId",
      "inspectionID",
      "reportNumber",
      "reportNo",
    ],
    po
  );

  const reportDateInput = pickFirstValue(data, ["reportDate", "inspectionDate", "date"], "");
  const reportDate = normalizeReportDate(reportDateInput);

  const conclusionInput = pickFirstValue(
    data,
    ["conclusionStatus", "conclusion", "conclusionStep", "overallResult", "finalResult"],
    ""
  );
  const inferredConclusion = inferConclusionFromSummary(data);
  const normalizedConclusion = normalizeConclusionValue(conclusionInput) || inferredConclusion || "-";

  return {
    ...data,
    reportHeader: {
      client,
      po,
      inspectionNumber,
      reportDate,
      conclusion: normalizedConclusion,
    },
  };
};

module.exports = {
  safeJsonParse,
  normalizePayload,
  enrichReportHeaderData,
  normalizeConclusionValue,
};
