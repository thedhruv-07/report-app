import React, { useState } from "react";
import { Plus } from "lucide-react";
import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { RemoveRowButton } from './RowButtons';

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

const DEFAULT_ITEM = { itemName: "", qtyCartonMarking: "", qtyCartonActual: "", cartonSizeMarking: "", cartonSizeActual: "", weightMarking: "", weightActual: "", qtyInnerMarking: "", qtyInnerActual: "" };

export default function CLSPackingTable({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ target: { name: field, value } });
  };

  const [items, setItems] = useState(() => {
    const existing = formData.clsPackingItems;
    return Array.isArray(existing) && existing.length > 0 ? existing : [{ ...DEFAULT_ITEM }];
  });
  const [nextId, setNextId] = useState(items.length + 1);

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
    handleChange("clsPackingItems", updated);
  };

  const addItem = () => {
    const updated = [...items, { ...DEFAULT_ITEM }];
    setItems(updated);
    setNextId(nextId + 1);
    handleChange("clsPackingItems", updated);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    handleChange("clsPackingItems", updated);
  };

  const packingResultColor = getResultColor(formData.cls_packing_result);

  return (
    <div style={{ color: colors.text, fontSize: "14px" }}>
      {/* ── Package Details Table ── */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <thead>
            {/* C. PACKING Title */}
            <tr>
              <th
                colSpan={10}
                style={{ padding: "10px 12px", background: sectionHeaderBg, border: cellBorder, color: headerColor, textAlign: "left", fontWeight: "bold", fontSize: "14px" }}
              >
                C.&nbsp;&nbsp;PACKING
              </th>
            </tr>
            {/* Package Details with icon */}
            <tr>
              <th
                colSpan={7}
                style={{ padding: "10px 12px", background: sectionHeaderBg, borderBottom: cellBorder, borderTop: cellBorder, borderLeft: cellBorder, borderRight: "none", color: colors.text, textAlign: "left", fontWeight: "bold", fontSize: "14px" }}
              >
                Package Details:
              </th>
              <th
                colSpan={3}
                style={{ padding: "10px 12px", background: sectionHeaderBg, borderBottom: cellBorder, borderTop: cellBorder, borderRight: cellBorder, borderLeft: "none", textAlign: "right" }}
              >
                <img src="/package.png" alt="Package Logo" style={{ height: "44px", width: "auto" }} />
              </th>
            </tr>
            {/* Sub-headers Row 1 */}
            <tr>
              <th rowSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold" }}>Item No.</th>
              <th colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Qty / Carton</th>
              <th colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Carton Size L×W×H (cm)</th>
              <th colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Gross Weight (KG)</th>
              <th colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Qty / Inner box</th>
              <th
                rowSpan={2}
                style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", width: "30px" }}
              >
                <button type="button" onClick={addItem}
                  style={{ background: colors.primary, color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={12} />
                </button>
              </th>
            </tr>
            {/* Sub-headers Row 2 */}
            <tr>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Marking</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Actual</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Marking</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Actual</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Marking</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Actual</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Marking</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>Actual</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.itemName || ""} onChange={(e) => updateItem(idx, "itemName", e.target.value)} style={{ ...inputBase, textAlign: "left" }} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.qtyCartonMarking || ""} onChange={(e) => updateItem(idx, "qtyCartonMarking", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.qtyCartonActual || ""} onChange={(e) => updateItem(idx, "qtyCartonActual", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.cartonSizeMarking || ""} onChange={(e) => updateItem(idx, "cartonSizeMarking", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.cartonSizeActual || ""} onChange={(e) => updateItem(idx, "cartonSizeActual", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.weightMarking || ""} onChange={(e) => updateItem(idx, "weightMarking", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.weightActual || ""} onChange={(e) => updateItem(idx, "weightActual", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.qtyInnerMarking || ""} onChange={(e) => updateItem(idx, "qtyInnerMarking", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" value={item.qtyInnerActual || ""} onChange={(e) => updateItem(idx, "qtyInnerActual", e.target.value)} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "4px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <RemoveRowButton onClick={() => removeItem(idx)} disabled={items.length <= 1} />
                </td>
              </tr>
            ))}

            {/* Export Carton Details */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Export Carton Details</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>Fastening Metal Staples</td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select value={formData.cls_fastening_metal_staples || ""} onChange={(e) => handleChange("cls_fastening_metal_staples", e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value=""></option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>Nylon Band</td>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select value={formData.cls_nylon_band || ""} onChange={(e) => handleChange("cls_nylon_band", e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value=""></option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>Material</td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select value={formData.cls_material || ""} onChange={(e) => handleChange("cls_material", e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value=""></option>
                  <option value="Cardboard">Cardboard</option>
                  <option value="Plastic">Plastic</option>
                  <option value="Wood">Wood</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>Corrugated Paper Plies</td>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, display: "flex", alignItems: "center" }}>
                <input type="number" value={formData.cls_corrugated_paper_plies || ""} onChange={(e) => handleChange("cls_corrugated_paper_plies", e.target.value)} style={{ ...inputBase, textAlign: "right", width: "40px" }} />
                <span>-ply</span>
              </td>
            </tr>

            {/* Packing Method */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>Packing Method</td>
            </tr>
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <textarea
                  value={formData.cls_packing_method || ""}
                  onChange={(e) => handleChange("cls_packing_method", e.target.value)}
                  placeholder="NA"
                  style={{ ...inputBase, minHeight: "40px" }}
                />
              </td>
            </tr>

            {/* Assortment Method */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>Assortment Method</td>
            </tr>
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                  {["By Color", "By Size", "By Design", "Other", "No assortment"].map((opt) => {
                    const isChecked = (formData.cls_assortment_method || "").includes(opt);
                    return (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let arr = (formData.cls_assortment_method || "").split(", ").filter(Boolean);
                            if (e.target.checked) arr.push(opt);
                            else arr = arr.filter(x => x !== opt);
                            handleChange("cls_assortment_method", arr.join(", "));
                          }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </td>
            </tr>
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
                  value={formData.cls_packing_result || ""}
                  onChange={(e) => handleChange("cls_packing_result", e.target.value)}
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: packingResultColor, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", outline: "none" }}
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
                  name="cls_packing_remark"
                  value={formData.cls_packing_remark || ""}
                  onChange={(e) => handleChange("cls_packing_remark", e.target.value)}
                  placeholder="Enter packing remarks..."
                  context="packing inspection observations"
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
