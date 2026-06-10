import { useState } from "react";
import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const Packing = ({ form, handleChange, quantityItems = [], onPrev, onNext }) => {
  const setField = (name, value) => handleChange({ target: { name, value } });

  // Initialise packing rows from quantity items (step 5) if available, otherwise 3 empty rows
  const [items, setItems] = useState(() => {
    const base = quantityItems.filter(qi => qi.name?.trim());
    if (base.length > 0) return base.map((qi, i) => ({ id: i + 1, name: qi.name }));
    return [{ id: 1, name: '' }, { id: 2, name: '' }, { id: 3, name: '' }];
  });
  const [nextId, setNextId] = useState(() =>
    Math.max(quantityItems.filter(qi => qi.name?.trim()).length, 3) + 1
  );

  const addItem = () => {
    setItems([...items, { id: nextId, name: "" }]);
    setNextId(nextId + 1);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
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
                colSpan={10}
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
                colSpan={7}
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
              <th rowSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "center", cursor: "pointer", width: "30px", fontSize: "16px" }} onClick={addItem}>+</th>
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
                    value={form[`packing_item_${item.id}`] ?? item.name}
                    onChange={handleChange}
                    style={{ ...inputBase, textAlign: "left" }}
                  />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="number" name={`packing_qty_carton_marking_${item.id}`} value={form[`packing_qty_carton_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="number" name={`packing_qty_carton_actual_${item.id}`} value={form[`packing_qty_carton_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_carton_size_marking_${item.id}`} value={form[`packing_carton_size_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`packing_carton_size_actual_${item.id}`} value={form[`packing_carton_size_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="number" name={`packing_weight_marking_${item.id}`} value={form[`packing_weight_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="number" name={`packing_weight_actual_${item.id}`} value={form[`packing_weight_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="number" name={`packing_qty_inner_marking_${item.id}`} value={form[`packing_qty_inner_marking_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="number" name={`packing_qty_inner_actual_${item.id}`} value={form[`packing_qty_inner_actual_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    style={{ background: "transparent", color: items.length === 1 ? colors.textMuted : colors.danger, border: "none", cursor: items.length === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}

            {/* Export Carton Details Header */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Export Carton Details
              </td>
            </tr>

            {/* Staples & Band */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Fastening Metal Staples
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="fastening_metal_staples" value={form.fastening_metal_staples || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "left", cursor: "pointer" }}>
                  <option value=""></option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Nylon Band
              </td>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="nylon_band" value={form.nylon_band || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "left", cursor: "pointer" }}>
                  <option value=""></option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
            </tr>

            {/* Material & Corrugated */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Material
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="material" value={form.material || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "left", cursor: "pointer" }}>
                  <option value=""></option>
                  <option value="Cardboard">Cardboard</option>
                  <option value="Plastic">Plastic</option>
                  <option value="Wood">Wood</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "right" }}>
                Corrugated Paper Plies
              </td>
              <td colSpan={3} style={{ padding: "8px", background: colors.surface, border: cellBorder, display: "flex", alignItems: "center" }}>
                <input type="number" name="corrugated_paper_plies" value={form.corrugated_paper_plies || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "right", width: "40px" }} />
                <span>-ply</span>
              </td>
            </tr>

            {/* Packing Method Header */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>
                Packing Method
              </td>
            </tr>
            {/* Packing Method Data */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
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
              <td colSpan={10} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>
                Assortment Method
              </td>
            </tr>
            {/* Assortment Method Data */}
            <tr>
              <td colSpan={10} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                  {["By Color", "By Size", "By Design", "Other", "No assortment"].map((opt) => {
                    const isChecked = (form.assortment_method || "").includes(opt);
                    return (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let arr = (form.assortment_method || "").split(', ').filter(Boolean);
                            if (e.target.checked) {
                              arr.push(opt);
                            } else {
                              arr = arr.filter(x => x !== opt);
                            }
                            setField("assortment_method", arr.join(', '));
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
                Result <span style={{color: "#CC0000"}}>*</span>
              </td>
              <td style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <select
                  name="packing_result"
                  value={form.packing_result || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: packColor, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", outline: "none" }}
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
                  name="packing_remark"
                  value={form.packing_remark || "No packing"}
                  onChange={(e) => setField("packing_remark", e.target.value)}
                  context="packing inspection observations and discrepancies"
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

export default Packing;
