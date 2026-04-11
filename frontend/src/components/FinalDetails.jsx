import React, { useState } from "react";
import { colors, buttonStyle } from "../styles";

const Packing = ({ form, handleChange, onPrev, onNext }) => {
  const [items] = useState([
    { id: 1, name: "30B nut forming machine (Model: 30B-6S-40)" },
    { id: 2, name: "Mould M10" }
  ]);

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 9: E. PACKING
      </h2>

      {/* Package Details Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", color: colors.text }}>Package Details:</div>
        <div style={{ width: "100px", height: "80px", border: `2px solid ${colors.border}`, background: colors.surfaceAlt, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: colors.text, fontSize: "10px" }}>
            <div>H</div>
            <div style={{ margin: "5px 0" }}>W     L</div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th rowSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Item No.</th>
              <th colSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Qty / Carton</th>
              <th colSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Carton Size L×W×H (cm)</th>
              <th colSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Gross Weight (KG)</th>
              <th colSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", textAlign: "center" }}>Qty / Inner box</th>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Marking</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Actual</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Marking</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Actual</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Marking</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Actual</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Marking</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Actual</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input
                    type="text"
                    name={`packing_item_${item.id}`}
                    value={form[`packing_item_${item.id}`] || item.name}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "4px",
                      background: colors.surface,
                      color: colors.text,
                      border: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </td>
                {/* Qty / Carton */}
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_qty_carton_marking_${item.id}`} value={form[`packing_qty_carton_marking_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_qty_carton_actual_${item.id}`} value={form[`packing_qty_carton_actual_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                {/* Carton Size */}
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_carton_size_marking_${item.id}`} value={form[`packing_carton_size_marking_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_carton_size_actual_${item.id}`} value={form[`packing_carton_size_actual_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                {/* Gross Weight */}
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_weight_marking_${item.id}`} value={form[`packing_weight_marking_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_weight_actual_${item.id}`} value={form[`packing_weight_actual_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                {/* Qty / Inner box */}
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_qty_inner_marking_${item.id}`} value={form[`packing_qty_inner_marking_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <input type="text" name={`packing_qty_inner_actual_${item.id}`} value={form[`packing_qty_inner_actual_${item.id}`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", boxSizing: "border-box" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Carton Details */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "20%" }}>Export Carton Details</td>
              <td colSpan="1" style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Fastening Metal Staples</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="fastening_metal_staples" value={form.fastening_metal_staples || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Nylon Band</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="nylon_band" value={form.nylon_band || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Material</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="material" value={form.material || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Corrugated Paper Plies</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="corrugated_paper_plies" value={form.corrugated_paper_plies || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Packing Method */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Packing Method</td>
            </tr>
            <tr>
              <td style={{ padding: "40px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <textarea
                  name="packing_method"
                  value={form.packing_method || ""}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: colors.surface,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    boxSizing: "border-box",
                    minHeight: "80px",
                    fontFamily: "Arial"
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Assortment Method */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Assortment Method</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="assortment_method"
                  value={form.assortment_method || "No assortment"}
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

      {/* Result and Remark */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "15%" }}>Result:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="packing_result"
                  value={form.packing_result || "Pending"}
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
                  name="packing_remark"
                  value={form.packing_remark || ""}
                  onChange={handleChange}
                  placeholder="e.g. N/A"
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
        <button
          onClick={onPrev}
          style={{ ...buttonStyle }}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          style={{ ...buttonStyle }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Packing;
