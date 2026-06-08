import React, { useState } from "react";
import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const borderColor = "#1F1F1F";
const cellBorder = `1px solid ${borderColor}`;
const sectionHeaderBg = "#E8E8E8";
const subHeaderBg = "#E9ECEF";
const headerColor = "#1F4E79";

const inputBase = {
  width: "100%",
  padding: "4px",
  background: colors.surface,
  color: colors.text,
  border: "none",
  boxSizing: "border-box",
  fontSize: "12px",
  fontFamily: "inherit"
};

const getResultColor = (val) => {
  if (!val) return colors.text;
  if (val.toLowerCase().includes("pass")) return "#228B22";
  if (val.toLowerCase().includes("fail")) return "#CC0000";
  return colors.text;
};

const DEFAULT_STYLE_ROW = { description: "", result: "" };
const DEFAULT_WORK_ROW  = { description: "", result: "" };

export default function ProductConformityTable({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ target: { name: field, value } });
  };

  // Style & Color rows
  const [styleRows, setStyleRows] = useState(() =>
    Array.isArray(formData.styleColorRows) && formData.styleColorRows.length > 0
      ? formData.styleColorRows
      : [
          { description: " - Conform to product specification (Including color, accessories, hangtag/labels, logo/markings)", result: "" },
          { description: " - Conform to reference sample", result: "" },
          { description: " - Conform to product digital photo", result: "" },
          { description: " - Others", result: "" },
        ]
  );

  // Workmanship rows
  const [workRows, setWorkRows] = useState(() =>
    Array.isArray(formData.workmanshipRows) && formData.workmanshipRows.length > 0
      ? formData.workmanshipRows
      : [
          { description: " - Obvious visual defects (appearance, artwork, logo)", result: "" },
          { description: " - Base function check (no need to use equipment to check)", result: "" },
        ]
  );

  const updateStyleRow = (idx, field, value) => {
    const updated = styleRows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setStyleRows(updated);
    handleChange("styleColorRows", updated);
  };

  const addStyleRow = () => {
    const updated = [...styleRows, { ...DEFAULT_STYLE_ROW }];
    setStyleRows(updated);
    handleChange("styleColorRows", updated);
  };

  const removeStyleRow = (idx) => {
    if (styleRows.length <= 1) return;
    const updated = styleRows.filter((_, i) => i !== idx);
    setStyleRows(updated);
    handleChange("styleColorRows", updated);
  };

  const updateWorkRow = (idx, field, value) => {
    const updated = workRows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setWorkRows(updated);
    handleChange("workmanshipRows", updated);
  };

  const addWorkRow = () => {
    const updated = [...workRows, { ...DEFAULT_WORK_ROW }];
    setWorkRows(updated);
    handleChange("workmanshipRows", updated);
  };

  const removeWorkRow = (idx) => {
    if (workRows.length <= 1) return;
    const updated = workRows.filter((_, i) => i !== idx);
    setWorkRows(updated);
    handleChange("workmanshipRows", updated);
  };

  const conformityResultColor = getResultColor(formData.conformityOverallResult);

  return (
    <div style={{ color: colors.text, fontSize: "14px" }}>
      {/* ── Main Table ── */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <thead>
            <tr>
              <th colSpan={3} style={{ padding: "10px 12px", background: sectionHeaderBg, border: cellBorder, color: headerColor, textAlign: "left", fontWeight: "bold", fontSize: "14px" }}>
                B.&nbsp;&nbsp;PRODUCT CONFORMITY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Selected Cartons */}
            <tr>
              <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, fontWeight: "bold", color: colors.text, width: "200px" }}>Selected Cartons:</td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" value={formData.selectedCartons || ""} onChange={(e) => handleChange("selectedCartons", e.target.value)} placeholder="(3 carton per model)" style={inputBase} />
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" value={formData.randomSelectionInfo || ""} onChange={(e) => handleChange("randomSelectionInfo", e.target.value)} placeholder="12 Cartons were selected randomly on site. No carton number in shipping mark." style={{ ...inputBase, textDecoration: "underline" }} />
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" value={formData.cartonNoInfo || ""} onChange={(e) => handleChange("cartonNoInfo", e.target.value)} placeholder="Carton No.: NA" style={inputBase} />
              </td>
            </tr>

            {/* Check Contents */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, fontWeight: "bold", color: colors.text }}>Check Contents Inside Packaging</td>
            </tr>

            {/* 1. Style and Color */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, fontWeight: "bold", color: colors.text }}>1. Style and Color</td>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left", width: "60%" }}>Description</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "30%" }}>Result</th>
              {/* + add icon */}
              <th
                style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "30px", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}
                onClick={addStyleRow}
                title="Add row"
              >+</th>
            </tr>
            {styleRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={row.description} onChange={(e) => updateStyleRow(idx, "description", e.target.value)} style={inputBase} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select value={row.result} onChange={(e) => updateStyleRow(idx, "result", e.target.value)} style={{ ...inputBase, cursor: "pointer", color: getResultColor(row.result), fontWeight: row.result ? "bold" : "normal" }}>
                    <option value="">Select...</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <button
                    onClick={() => removeStyleRow(idx)}
                    disabled={styleRows.length === 1}
                    style={{ background: "transparent", color: styleRows.length === 1 ? "#ccc" : "#CC0000", border: "none", cursor: styleRows.length === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >x</button>
                </td>
              </tr>
            ))}

            {/* 2. Workmanship */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, fontWeight: "bold", color: colors.text }}>2. Workmanship &amp; Function Check (2 units per model, but no more than 20 units)</td>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Description</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center" }}>Result</th>
              <th
                style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}
                onClick={addWorkRow}
                title="Add row"
              >+</th>
            </tr>
            {workRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={row.description} onChange={(e) => updateWorkRow(idx, "description", e.target.value)} style={inputBase} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select value={row.result} onChange={(e) => updateWorkRow(idx, "result", e.target.value)} style={{ ...inputBase, cursor: "pointer", color: getResultColor(row.result), fontWeight: row.result ? "bold" : "normal" }}>
                    <option value="">Select...</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <button
                    onClick={() => removeWorkRow(idx)}
                    disabled={workRows.length === 1}
                    style={{ background: "transparent", color: workRows.length === 1 ? "#ccc" : "#CC0000", border: "none", cursor: workRows.length === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >x</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Result & Remarks section */}
      <div style={{ marginBottom: "25px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "bold", color: colors.text, marginBottom: "10px" }}>Result</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "10px 12px", border: cellBorder, background: "#f8fafc", fontWeight: "bold", textAlign: "left", color: colors.text, width: "150px" }}>
                Result <span style={{ color: "#CC0000" }}>*</span>
              </td>
              <td style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <select
                  value={formData.conformityOverallResult || ""}
                  onChange={(e) => handleChange("conformityOverallResult", e.target.value)}
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: conformityResultColor, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", outline: "none" }}
                >
                  <option value="">Select...</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                  <option value="N/A">N/A</option>
                </select>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px 12px", border: cellBorder, background: "#f8fafc", fontWeight: "bold", textAlign: "left", color: colors.text }}>
                Remarks
              </td>
              <td style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <SmartTextarea
                  name="conformityRemark"
                  value={formData.conformityRemark || ""}
                  onChange={(e) => handleChange("conformityRemark", e.target.value)}
                  placeholder="Enter observation or remark..."
                  context="product conformity inspection observations"
                  style={{ width: "100%", minHeight: "40px", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "12px", boxSizing: "border-box" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
