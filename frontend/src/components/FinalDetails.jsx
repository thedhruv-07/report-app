import React, { useState } from "react";
import { colors, buttonStyle } from "../styles";

const Packing = ({ form, handleChange, onPrev, onNext }) => {
  const [items] = useState([
    { id: 1, name: "30B nut forming machine (Model: 30B-6S-40)" },
    { id: 2, name: "Mould M10" },
    { id: 3, name: "" }
  ]);

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

  const packColor = getResultColor(form.packing_result);

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 9: E. PACKING
      </h2>

      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <thead>
            {/* E. PACKING Title */}
            <tr>
              <th
                colSpan={9}
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
                E.&nbsp;&nbsp;PACKING
              </th>
            </tr>
            {/* Package Details with Logo */}
            <tr>
              <th
                colSpan={6}
                style={{
                  padding: "10px 12px",
                  background: sectionHeaderBg,
                  borderBottom: cellBorder,
                  borderTop: cellBorder,
                  borderLeft: cellBorder,
                  borderRight: "none",
                  color: colors.text,
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                Package Details:
              </th>
              <th
                colSpan={3}
                style={{
                  padding: "10px 12px",
                  background: sectionHeaderBg,
                  borderBottom: cellBorder,
                  borderTop: cellBorder,
                  borderRight: cellBorder,
                  borderLeft: "none",
                  textAlign: "right",
                }}
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
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input
                    type="text"
                    name={`packing_item_${item.id}`}
                    value={form[`packing_item_${item.id}`] || item.name}
                    onChange={handleChange}
                    style={{ ...inputBase, textAlign: "left" }}
                  />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_qty_carton_marking_${item.id}`} value={form[`packing_qty_carton_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_qty_carton_actual_${item.id}`} value={form[`packing_qty_carton_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_carton_size_marking_${item.id}`} value={form[`packing_carton_size_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_carton_size_actual_${item.id}`} value={form[`packing_carton_size_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_weight_marking_${item.id}`} value={form[`packing_weight_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_weight_actual_${item.id}`} value={form[`packing_weight_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_qty_inner_marking_${item.id}`} value={form[`packing_qty_inner_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_qty_inner_actual_${item.id}`} value={form[`packing_qty_inner_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
              </tr>
            ))}

            {/* Export Carton Details Header */}
            <tr>
              <td colSpan={9} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Export Carton Details
              </td>
            </tr>

            {/* Staples & Band */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Fastening Metal Staples
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="fastening_metal_staples" value={form.fastening_metal_staples || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "left" }} placeholder="-" />
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Nylon Band
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="nylon_band" value={form.nylon_band || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "left" }} placeholder="-" />
              </td>
            </tr>

            {/* Material & Corrugated */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Material
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="material" value={form.material || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "left" }} placeholder="-" />
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Corrugated Paper Plies
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, display: "flex", alignItems: "center" }}>
                <input type="text" name="corrugated_paper_plies" value={form.corrugated_paper_plies || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "right", width: "40px" }} />
                <span>-ply</span>
              </td>
            </tr>

            {/* Packing Method Header */}
            <tr>
              <td colSpan={9} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>
                Packing Method
              </td>
            </tr>
            {/* Packing Method Data */}
            <tr>
              <td colSpan={9} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <textarea
                  name="packing_method"
                  value={form.packing_method || ""}
                  onChange={handleChange}
                  placeholder="NA"
                  style={{ ...inputBase, minHeight: "40px" }}
                />
              </td>
            </tr>

            {/* Assortment Method Header */}
            <tr>
              <td colSpan={9} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>
                Assortment Method
              </td>
            </tr>
            {/* Assortment Method Data */}
            <tr>
              <td colSpan={9} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="assortment_method"
                  value={form.assortment_method || "No assortment"}
                  onChange={handleChange}
                  style={inputBase}
                />
              </td>
            </tr>

            {/* Result */}
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Result:
              </td>
              <td colSpan={7} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="packing_result"
                  value={form.packing_result || ""}
                  onChange={handleChange}
                  placeholder="Failed"
                  style={{ ...inputBase, color: packColor, fontWeight: "bold" }}
                />
              </td>
            </tr>

            {/* Remark */}
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>
                Remark:
              </td>
              <td colSpan={7} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="packing_remark"
                  value={form.packing_remark || "No packing"}
                  onChange={handleChange}
                  style={inputBase}
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

export default Packing;
