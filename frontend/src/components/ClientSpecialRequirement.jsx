import React, { useState } from "react";
import { colors, buttonStyle } from "../styles";

const normalizeRequirements = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ index: 1, requirement: "", result: "" }];
  }

  return value.map((req, idx) => ({
    index: idx + 1,
    requirement: typeof req?.requirement === "string" ? req.requirement : "",
    result: typeof req?.result === "string" ? req.result : "",
  }));
};

const ClientSpecialRequirement = ({ form, handleChange, onPrev, onNext, onRequirementsChange }) => {
  const [requirements, setRequirements] = useState(() => normalizeRequirements(form.clientRequirements));

  const persistRequirements = (newRequirements) => {
    setRequirements(newRequirements);
    if (typeof onRequirementsChange === "function") {
      onRequirementsChange(newRequirements);
    }
  };

  const handleRequirementChange = (index, field, value) => {
    const newRequirements = [...requirements];
    newRequirements[index][field] = value;
    persistRequirements(newRequirements);
  };

  const addRequirement = () => {
    persistRequirements([
      ...requirements,
      { index: requirements.length + 1, requirement: "", result: "" }
    ]);
  };

  const removeRequirement = (index) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    // Re-index the remaining items
    newRequirements.forEach((req, idx) => {
      req.index = idx + 1;
    });
    persistRequirements(newRequirements);
  };

  const borderColor = "#1F1F1F";
  const cellBorder = `1px solid ${borderColor}`;
  const sectionHeaderBg = "#E8E8E8";
  const subHeaderBg = "#E9ECEF";
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

  // Color logic for result values
  const getResultColor = (value) => {
    const v = String(value || "").trim().toLowerCase();
    if (v.includes("fail")) return "#CC0000";
    if (v.includes("pass")) return "#228B22";
    return colors.text; 
  };

  const clientResultColor = getResultColor(form.client_requirement_result);

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 11: G. CLIENT SPECIAL REQUIREMENT
      </h2>

      {/* Client Requirements Unified Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <thead>
            {/* Main Header */}
            <tr>
              <th
                colSpan={3}
                style={{
                  padding: "10px 12px",
                  background: sectionHeaderBg,
                  border: cellBorder,
                  color: "#1F4E79",
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                G.&nbsp;&nbsp;CLIENT SPECIAL REQUIREMENT
              </th>
            </tr>
            {/* Sub-header */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>
                Client Requirements:
              </td>
            </tr>
            {/* Column labels */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, width: "5%" }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center" }}>Client Requirements</td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "15%" }}>Result</td>
            </tr>
          </thead>
          <tbody>
            {/* Dynamic Rows */}
            {requirements.map((req, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "left", color: colors.text }}>
                  {req.index}.
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input
                    type="text"
                    value={req.requirement}
                    onChange={(e) => handleRequirementChange(idx, "requirement", e.target.value)}
                    style={inputBase}
                    placeholder="-"
                  />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={req.result}
                      onChange={(e) => handleRequirementChange(idx, "result", e.target.value)}
                      style={{ ...inputBase, textAlign: "center" }}
                      placeholder="-"
                    />
                    {requirements.length > 1 && (
                      <button
                        onClick={() => removeRequirement(idx)}
                        style={{
                          padding: "4px 8px",
                          background: colors.danger,
                          color: "#fff",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "11px"
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {/* Result Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Result:
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="client_requirement_result"
                  value={form.client_requirement_result || ""}
                  onChange={handleChange}
                  placeholder="NA"
                  style={{ ...inputBase, color: clientResultColor, fontWeight: "bold" }}
                />
              </td>
            </tr>

            {/* Remark Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>
                Remark:
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="client_requirement_remark"
                  value={form.client_requirement_remark || "NA"}
                  onChange={handleChange}
                  style={inputBase}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: "25px" }}>
        <button onClick={addRequirement} style={{ ...buttonStyle, marginBottom: "0" }}>
          + Add Requirement
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
        <button onClick={onPrev} style={{ ...buttonStyle }}>
          Previous
        </button>
        <button onClick={onNext} style={{ ...buttonStyle }}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ClientSpecialRequirement;
