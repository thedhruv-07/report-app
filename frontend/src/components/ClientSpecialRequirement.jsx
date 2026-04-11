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

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 11: G. CLIENT SPECIAL REQUIREMENT
      </h2>

      {/* Client Requirements Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td colSpan="3" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>
                Client Requirements:
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "5%" }}>No.</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "70%" }}>Client Requirements</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "25%" }}>Result</td>
            </tr>
            {/* Dynamic Rows */}
            {requirements.map((req, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, textAlign: "center", color: colors.text }}>
                  {req.index}.
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input
                    type="text"
                    value={req.requirement}
                    onChange={(e) => handleRequirementChange(idx, "requirement", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px",
                      background: colors.surface,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      boxSizing: "border-box"
                    }}
                    placeholder="-"
                  />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, display: "flex", gap: "5px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={req.result}
                    onChange={(e) => handleRequirementChange(idx, "result", e.target.value)}
                    style={{
                      flex: 1,
                      padding: "4px",
                      background: colors.surface,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      boxSizing: "border-box"
                    }}
                    placeholder="-"
                  />
                  {requirements.length > 1 && (
                    <button
                      onClick={() => removeRequirement(idx)}
                      style={{
                        padding: "4px 8px",
                        background: colors.danger,
                        color: colors.text,
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Requirement Button */}
      <div style={{ marginBottom: "25px" }}>
        <button
          onClick={addRequirement}
          style={{ ...buttonStyle, marginBottom: "0" }}
        >
          + Add Requirement
        </button>
      </div>

      {/* Result and Remark */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "15%" }}>Result:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="client_requirement_result"
                  value={form.client_requirement_result || ""}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "4px",
                    background: colors.surface,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    boxSizing: "border-box"
                  }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Remark:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="client_requirement_remark"
                  value={form.client_requirement_remark || ""}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "4px",
                    background: colors.surface,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    boxSizing: "border-box"
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
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
