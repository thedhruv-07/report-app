import React from "react";
import { colors } from "../../styles";
import SmartTextarea from "../SmartTextarea";

export default function ProductConformityTable({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ target: { name: field, value } });
  };

  const getResultColor = (val) => {
    if (!val) return colors.text;
    if (val.toLowerCase().includes("pass")) return colors.success;
    if (val.toLowerCase().includes("fail")) return colors.danger;
    if (val.toLowerCase().includes("pending")) return colors.warning;
    return colors.text;
  };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px" }}>
      {/* Title */}
      <div style={{ padding: "8px", background: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1F4E79" }}>B. PRODUCT CONFORMITY</h3>
      </div>

      {/* Selected Cartons */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ padding: "8px", fontWeight: "bold", minWidth: "140px", borderRight: `1px solid ${colors.border}` }}>Selected Cartons :</div>
        <div style={{ padding: "8px", flex: 1 }}>
          <input 
            type="text" 
            value={formData.selectedCartons || ""} 
            onChange={(e) => handleChange("selectedCartons", e.target.value)}
            placeholder="(3 carton per model)"
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Random Selection Info */}
      <div style={{ padding: "8px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <input 
          type="text" 
          value={formData.randomSelectionInfo || ""} 
          onChange={(e) => handleChange("randomSelectionInfo", e.target.value)}
          placeholder="12 Cartons were selected randomly on site. No carton number in shipping mark."
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px", textDecoration: "underline" }}
        />
      </div>

      {/* Carton No Info */}
      <div style={{ padding: "8px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <input 
          type="text" 
          value={formData.cartonNoInfo || ""} 
          onChange={(e) => handleChange("cartonNoInfo", e.target.value)}
          placeholder="Carton No.: NA"
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
        />
      </div>

      {/* Product Name Grid */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ width: "25%", padding: "8px", borderRight: `1px solid ${colors.border}` }}>
          <input 
            type="text" 
            value={formData.productName || ""} 
            onChange={(e) => handleChange("productName", e.target.value)}
            placeholder="Frozen Buffalo FQ Rolls"
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
          />
        </div>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{ width: "8.33%", padding: "8px", borderRight: i === 8 ? "none" : `1px solid ${colors.border}`, textAlign: "center" }}>
            /
          </div>
        ))}
      </div>

      {/* Check Contents Inside Packaging */}
      <div style={{ padding: "8px", background: colors.lightGray, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>
        Check Contents Inside Packaging
      </div>

      {/* 1. Style and Color Header */}
      <div style={{ padding: "8px", background: colors.lightGray, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>
        1. Style and Color
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ width: "80%", padding: "8px", fontWeight: "bold", textAlign: "center", borderRight: `1px solid ${colors.border}` }}>Description</div>
        <div style={{ width: "20%", padding: "8px", fontWeight: "bold", textAlign: "center" }}>Result</div>
      </div>

      {[
        { key: "styleColorDesc1", default: " - Conform to product specification (Including color, accessories, hangtag/labels, logo/markings)" },
        { key: "styleColorDesc2", default: " - Conform to reference sample" },
        { key: "styleColorDesc3", default: " - Conform to product digital photo" },
        { key: "styleColorDesc4", default: " - Others" }
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
          <div style={{ width: "80%", padding: "8px", borderRight: `1px solid ${colors.border}` }}>
            <input
              type="text"
              value={formData[item.key] !== undefined ? formData[item.key] : item.default}
              onChange={(e) => handleChange(item.key, e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
            />
          </div>
          <div style={{ width: "20%", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {i < 3 ? (
              <select 
                value={formData.styleColorResult || "N/A"} 
                onChange={(e) => handleChange("styleColorResult", e.target.value)}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", textAlign: "center", fontWeight: "bold", color: getResultColor(formData.styleColorResult || "N/A") }}
              >
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
                <option value="N/A">N/A</option>
              </select>
            ) : null}
          </div>
        </div>
      ))}

      {/* 2. Workmanship Header */}
      <div style={{ padding: "8px", background: colors.lightGray, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>
        2. Workmanship & Function Check (2 units per model, but no more than 20 units)
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ width: "80%", padding: "8px", fontWeight: "bold", textAlign: "center", borderRight: `1px solid ${colors.border}` }}>Description</div>
        <div style={{ width: "20%", padding: "8px", fontWeight: "bold", textAlign: "center" }}>Result</div>
      </div>

      {[
        { key: "workmanshipDesc1", default: " - Obvious visual defects (appearance, artwork, logo)" },
        { key: "workmanshipDesc2", default: " - Base function check (no need to use equipment to check)" }
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
          <div style={{ width: "80%", padding: "8px", borderRight: `1px solid ${colors.border}` }}>
            <input
              type="text"
              value={formData[item.key] !== undefined ? formData[item.key] : item.default}
              onChange={(e) => handleChange(item.key, e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
            />
          </div>
          <div style={{ width: "20%", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <select 
              value={formData.workmanshipResult || "N/A"} 
              onChange={(e) => handleChange("workmanshipResult", e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", background: "transparent", textAlign: "center", fontWeight: "bold", color: getResultColor(formData.workmanshipResult || "N/A") }}
            >
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>
      ))}

      {/* Final Result */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ width: "20%", padding: "8px", fontWeight: "bold", borderRight: `1px solid ${colors.border}` }}>Result:</div>
        <div style={{ width: "80%", padding: "4px" }}>
          <select 
            value={formData.conformityOverallResult || "N/A"} 
            onChange={(e) => handleChange("conformityOverallResult", e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontWeight: "bold", color: getResultColor(formData.conformityOverallResult || "N/A") }}
          >
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", background: colors.surface }}>
        <div style={{ width: "20%", padding: "8px", fontWeight: "bold", borderRight: `1px solid ${colors.border}` }}>Remark:</div>
        <div style={{ width: "80%", padding: "8px" }}>
          <SmartTextarea
            name="conformityRemark"
            value={formData.conformityRemark || ""}
            onChange={(e) => handleChange("conformityRemark", e.target.value)}
            placeholder="Enter observation or remark..."
            minHeight={40}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
          />
        </div>
      </div>

    </div>
  );
}
