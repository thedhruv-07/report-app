import React, { useState } from "react";
import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { Lock } from 'lucide-react';

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

const ClientSpecialRequirement = ({ form, handleChange, onPrev, onNext, onRequirementsChange, lockedRequirementsCount = 0 }) => {
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
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, width: "40px", textAlign: "center", color: colors.text, fontWeight: "bold" }}>#</td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center" }}>Client Requirements</td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "20%" }}>Result</td>
              <td onClick={addRequirement} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "30px", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>+</td>
            </tr>
          </thead>
          <tbody>
            {/* Dynamic Rows */}
            {requirements.map((req, idx) => {
              const locked = idx < lockedRequirementsCount;
              const lockedBg = locked ? "#f8fafc" : colors.surface;
              return (
              <tr key={idx}>
                <td style={{ padding: "8px", background: lockedBg, border: cellBorder, textAlign: "center", color: colors.text, fontWeight: "bold" }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    {req.index}
                    {locked && <Lock size={9} color="#6366f1" />}
                  </div>
                </td>
                <td style={{ padding: "8px", background: lockedBg, border: cellBorder }}>
                  <input
                    type="text"
                    value={req.requirement}
                    onChange={(e) => handleRequirementChange(idx, "requirement", e.target.value)}
                    readOnly={locked}
                    style={{ ...inputBase, cursor: locked ? "not-allowed" : "text", color: locked ? "#64748b" : colors.text, background: lockedBg }}
                    placeholder="-"
                  />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select
                    value={req.result}
                    onChange={(e) => handleRequirementChange(idx, "result", e.target.value)}
                    style={{ ...inputBase, cursor: "pointer", color: getResultColor(req.result), fontWeight: req.result ? "bold" : "normal" }}
                  >
                    <option value="">Select...</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <button
                    onClick={() => removeRequirement(idx)}
                    disabled={locked || requirements.length === 1}
                    title={locked ? "Admin-set row cannot be deleted" : ""}
                    style={{ background: "transparent", color: locked || requirements.length === 1 ? "#ccc" : colors.danger, border: "none", cursor: locked || requirements.length === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >
                    x
                  </button>
                </td>
              </tr>
              );
            })}

            {/* (Result & Remark moved below) */}
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
                  name="client_requirement_result"
                  value={form.client_requirement_result || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: clientResultColor, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", outline: "none" }}
                >
                  <option value="">Select...</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                  <option value="N/A"></option>
                </select>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px 12px", border: cellBorder, background: "#f8fafc", fontWeight: "bold", textAlign: "left", color: colors.text }}>
                Remarks
              </td>
              <td style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <SmartTextarea
                  name="client_requirement_remark"
                  value={form.client_requirement_remark  }
                  onChange={(e) => handleChange({ target: { name: "client_requirement_remark", value: e.target.value } })}
                  context="client special requirement verification remark"
                  style={{ width: "100%", minHeight: "40px", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "12px", boxSizing: "border-box" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
};

export default ClientSpecialRequirement;
