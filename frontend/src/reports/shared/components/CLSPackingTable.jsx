import React from "react";
import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const sectionBg = "#E9ECEF";
const subHeaderBg = "#F2F2F2";
const headerColor = "#1F4E79";

export default function CLSPackingTable({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ target: { name: field, value } });
  };

  const handleArrayChange = (key, index, field, value) => {
    const arr = Array.isArray(formData[key]) ? [...formData[key]] : [];
    if (!arr[index]) arr[index] = {};
    arr[index] = { ...arr[index], [field]: value };
    handleChange(key, arr);
  };

  const addRow = (key, template) => {
    const arr = Array.isArray(formData[key]) ? [...formData[key]] : [];
    arr.push({ ...template });
    handleChange(key, arr);
  };

  const removeRow = (key, index) => {
    const arr = Array.isArray(formData[key]) ? [...formData[key]] : [];
    arr.splice(index, 1);
    handleChange(key, arr);
  };

  const packingItems = Array.isArray(formData.clsPackingItems) ? formData.clsPackingItems : [];
  const cartonConditions = Array.isArray(formData.clsCartonConditions) ? formData.clsCartonConditions : [];
  const getResultColor = (val) => {
    if (!val) return colors.text;
    if (val.toLowerCase().includes("pass")) return colors.success || "#228B22";
    if (val.toLowerCase().includes("fail")) return colors.danger || "#CC0000";
    if (val.toLowerCase().includes("pending")) return colors.warning || "#F39C12";
    return colors.text;
  };

  const cellStyle = { padding: "6px 8px", borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, fontSize: "12px" };
  const headerCellStyle = { ...cellStyle, fontWeight: "bold", background: subHeaderBg, textAlign: "center" };
  const inputStyle = { width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "12px", textAlign: "center" };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px" }}>
      {/* Header */}
      <div style={{ padding: "8px", background: sectionBg, borderBottom: `1px solid ${colors.border}` }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: headerColor }}>C. PACKING</h3>
      </div>

      {/* Package Details + Icon */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ flex: 1, padding: "8px", fontWeight: "bold" }}>Package Details</div>
        <div style={{ padding: "4px 12px", display: "flex", alignItems: "center" }}>📦</div>
      </div>

      {/* Item Table Headers */}
      <div style={{ display: "flex", background: subHeaderBg, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ ...headerCellStyle, width: "14%" }}>Item No.</div>
        <div style={{ ...headerCellStyle, width: "11%" }}>Qty/Carton<br/>Marking</div>
        <div style={{ ...headerCellStyle, width: "11%" }}>Qty/Carton<br/>Actual</div>
        <div style={{ ...headerCellStyle, width: "11%" }}>Qty/Inner<br/>Marking</div>
        <div style={{ ...headerCellStyle, width: "11%" }}>Qty/Inner<br/>Actual</div>
        <div style={{ ...headerCellStyle, width: "11%" }}>Weight<br/>Marking</div>
        <div style={{ ...headerCellStyle, width: "11%" }}>Weight<br/>Actual</div>
        <div style={{ ...headerCellStyle, width: "20%", borderRight: "none" }}>Carton Size<br/>(LxWxH cm)</div>
      </div>

      {/* Item Rows */}
      {packingItems.map((item, i) => (
        <div key={i} style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
          {["itemName", "qtyCartonMarking", "qtyCartonActual", "qtyInnerMarking", "qtyInnerActual", "weightMarking", "weightActual", "cartonSize"].map((field, j) => (
            <div key={field} style={{ ...cellStyle, width: j === 0 ? "14%" : j === 7 ? "20%" : "11%", borderRight: j === 7 ? "none" : cellStyle.borderRight }}>
              <input
                type="text"
                value={item[field] || ""}
                onChange={(e) => handleArrayChange("clsPackingItems", i, field, e.target.value)}
                placeholder="/"
                style={{ ...inputStyle, textAlign: j === 0 ? "left" : "center" }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Add/Remove Item Buttons */}
      <div style={{ display: "flex", gap: "8px", padding: "6px 8px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <button onClick={() => addRow("clsPackingItems", { itemName: "", qtyCartonMarking: "/", qtyCartonActual: "/", qtyInnerMarking: "/", qtyInnerActual: "/", weightMarking: "/", weightActual: "/", cartonSize: "/" })} style={{ background: headerColor, color: "#fff", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "11px" }}>+ Add Item</button>
        {packingItems.length > 0 && <button onClick={() => removeRow("clsPackingItems", packingItems.length - 1)} style={{ background: "#CC0000", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "11px" }}>- Remove Last</button>}
      </div>

      {/* Condition of Carton */}
      <div style={{ padding: "8px", background: subHeaderBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>Condition of Carton</div>
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: subHeaderBg }}>
        <div style={{ ...headerCellStyle, width: "75%" }}>Description</div>
        <div style={{ ...headerCellStyle, width: "25%", borderRight: "none" }}>Result</div>
      </div>
      {cartonConditions.map((c, i) => (
        <div key={i} style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
          <div style={{ ...cellStyle, width: "75%" }}>
            <input type="text" value={c.description || ""} onChange={(e) => handleArrayChange("clsCartonConditions", i, "description", e.target.value)} placeholder="/" style={{ ...inputStyle, textAlign: "left" }} />
          </div>
          <div style={{ ...cellStyle, width: "25%", borderRight: "none" }}>
            <input type="text" value={c.result || ""} onChange={(e) => handleArrayChange("clsCartonConditions", i, "result", e.target.value)} placeholder="/" style={inputStyle} />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "8px", padding: "6px 8px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <button onClick={() => addRow("clsCartonConditions", { description: "", result: "" })} style={{ background: headerColor, color: "#fff", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "11px" }}>+ Add Condition</button>
        {cartonConditions.length > 0 && <button onClick={() => removeRow("clsCartonConditions", cartonConditions.length - 1)} style={{ background: "#CC0000", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "11px" }}>- Remove Last</button>}
      </div>

      {/* Export Carton Details */}
      <div style={{ padding: "8px", background: subHeaderBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>Export Carton Details</div>
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ ...cellStyle, width: "25%", fontWeight: "bold" }}>Fastening Metal Staples</div>
        <div style={{ ...cellStyle, width: "25%" }}>
          <input type="text" value={formData.cls_fastening_metal_staples || ""} onChange={(e) => handleChange("cls_fastening_metal_staples", e.target.value)} placeholder="/" style={{ ...inputStyle, textAlign: "left" }} />
        </div>
        <div style={{ ...cellStyle, width: "25%", fontWeight: "bold" }}>Nylon Band</div>
        <div style={{ ...cellStyle, width: "25%", borderRight: "none" }}>
          <input type="text" value={formData.cls_nylon_band || ""} onChange={(e) => handleChange("cls_nylon_band", e.target.value)} placeholder="Yes" style={{ ...inputStyle, textAlign: "left" }} />
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ ...cellStyle, width: "25%", fontWeight: "bold" }}>Material</div>
        <div style={{ ...cellStyle, width: "25%" }}>
          <input type="text" value={formData.cls_material || ""} onChange={(e) => handleChange("cls_material", e.target.value)} placeholder="/" style={{ ...inputStyle, textAlign: "left" }} />
        </div>
        <div style={{ ...cellStyle, width: "25%", fontWeight: "bold" }}>Corrugated Paper Plies</div>
        <div style={{ ...cellStyle, width: "25%", borderRight: "none" }}>
          <input type="text" value={formData.cls_corrugated_paper_plies || ""} onChange={(e) => handleChange("cls_corrugated_paper_plies", e.target.value)} placeholder="/" style={{ ...inputStyle, textAlign: "left" }} />
        </div>
      </div>

      {/* Packing Method */}
      <div style={{ padding: "8px", background: subHeaderBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>Packing Method</div>
      <div style={{ padding: "8px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <input type="text" value={formData.cls_packing_method || ""} onChange={(e) => handleChange("cls_packing_method", e.target.value)} placeholder="/" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }} />
      </div>

      {/* Assortment Method */}
      <div style={{ padding: "8px", background: subHeaderBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>Assortment Method</div>
      <div style={{ padding: "8px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <input type="text" value={formData.cls_assortment_method || ""} onChange={(e) => handleChange("cls_assortment_method", e.target.value)} placeholder="No assortment packing" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }} />
      </div>

      {/* Shipping Marks */}
      <div style={{ padding: "8px", background: subHeaderBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold" }}>Shipping Marks</div>
      {[
        { labelKey: "cls_shipping_marks_label", resultKey: "cls_shipping_marks_result", defaultLabel: "Shipping Marks (on 2 Side )" },
        { labelKey: "cls_side_marks_label", resultKey: "cls_side_marks_result", defaultLabel: "Side Marks (on 2 Side )" },
        { labelKey: "cls_inner_box_marks_label", resultKey: "cls_inner_box_marks_result", defaultLabel: "Inner Box Marks (on /Side )" },
      ].map((mark, i) => (
        <div key={i} style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
          <div style={{ ...cellStyle, width: "60%" }}>
            <input type="text" value={formData[mark.labelKey] || ""} onChange={(e) => handleChange(mark.labelKey, e.target.value)} placeholder={mark.defaultLabel} style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "12px" }} />
          </div>
          <div style={{ ...cellStyle, width: "40%", borderRight: "none" }}>
            <input type="text" value={formData[mark.resultKey] || ""} onChange={(e) => handleChange(mark.resultKey, e.target.value)} placeholder="Actual finding" style={{ ...inputStyle, textAlign: "left" }} />
          </div>
        </div>
      ))}

      {/* Result */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div style={{ width: "20%", padding: "8px", fontWeight: "bold", borderRight: `1px solid ${colors.border}`, background: subHeaderBg }}>Result:</div>
        <div style={{ width: "80%", padding: "4px" }}>
          <select
            value={formData.cls_packing_result || "Passed"}
            onChange={(e) => handleChange("cls_packing_result", e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontWeight: "bold", color: getResultColor(formData.cls_packing_result || "Passed") }}
          >
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      </div>

      {/* Remark */}
      <div style={{ display: "flex", background: colors.surface }}>
        <div style={{ width: "20%", padding: "8px", fontWeight: "bold", borderRight: `1px solid ${colors.border}`, background: subHeaderBg }}>Remark:</div>
        <div style={{ width: "80%", padding: "8px" }}>
          <SmartTextarea
            name="cls_packing_remark"
            value={formData.cls_packing_remark || ""}
            onChange={(e) => handleChange("cls_packing_remark", e.target.value)}
            placeholder="Enter packing remarks..."
            minHeight={40}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "13px" }}
          />
        </div>
      </div>
    </div>
  );
}
