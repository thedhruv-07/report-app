import React, { useState } from "react";
import { colors, buttonStyle } from "../styles";

const ProductSpecification = ({ form, handleChange, onPrev, onNext }) => {
  const [items, setItems] = useState([{ id: 1 }, { id: 2 }]);
  const [nextId, setNextId] = useState(3);

  const addItem = () => {
    setItems([...items, { id: nextId }]);
    setNextId(nextId + 1);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Shared styles
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
  };

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 8: D. PRODUCT SPECIFICATION
      </h2>

      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <thead>
            {/* Section Header Row — grey background, blue text */}
            <tr>
              <th
                colSpan={7}
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
                D.&nbsp;&nbsp;PRODUCT SPECIFICATION
              </th>
            </tr>
            {/* Column Headers */}
            <tr>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}></th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>Client's Spec.</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>Ref. Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>1# Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>2# Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>3# Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}></th>
            </tr>
          </thead>
          <tbody>
            {/* First Item No. Row */}
            <tr>
              <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Item No.:</td>
              <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>
                <input
                  type="text"
                  name="productDescription"
                  value={form.productDescription || ""}
                  onChange={handleChange}
                  placeholder="30B nut forming machine (Model: 30B-6S-40)"
                  style={{ ...inputBase, textAlign: "center", fontWeight: "bold" }}
                />
              </td>
            </tr>

            {/* Blank Editable Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_0" value={form.blank_row_0 || ""} onChange={handleChange} style={inputBase} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_c0" value={form.blank_row_c0 || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_c1" value={form.blank_row_c1 || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_c2" value={form.blank_row_c2 || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_c3" value={form.blank_row_c3 || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_c4" value={form.blank_row_c4 || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                <button disabled style={{ padding: "4px 8px", background: colors.textMuted, color: "#fff", border: "none", borderRadius: "2px", cursor: "not-allowed", fontSize: "11px" }}>
                  Delete
                </button>
              </td>
            </tr>

            {/* Dynamic Item rows (Item No. header + data row pairs) */}
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {/* Item No. Header Row */}
                <tr>
                  <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Item No.:</td>
                  <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>
                    <input
                      type="text"
                      name={`item_${item.id}_desc`}
                      value={form[`item_${item.id}_desc`] || ""}
                      onChange={handleChange}
                      placeholder="e.g. Mould M10"
                      style={{ ...inputBase, textAlign: "center", fontWeight: "bold" }}
                    />
                  </td>
                </tr>

                {/* Data Row */}
                <tr>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_name`} value={form[`item_${item.id}_name`] || ""} onChange={handleChange} placeholder="Item name" style={inputBase} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_c0`} value={form[`item_${item.id}_c0`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_c1`} value={form[`item_${item.id}_c1`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_c2`} value={form[`item_${item.id}_c2`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_c3`} value={form[`item_${item.id}_c3`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_c4`} value={form[`item_${item.id}_c4`] || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      style={{
                        padding: "4px 8px",
                        background: items.length === 1 ? colors.textMuted : colors.danger,
                        color: "#fff",
                        border: "none",
                        borderRadius: "2px",
                        cursor: items.length === 1 ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}

            {/* Result Row */}
            <tr>
              <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Result:</td>
              <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="productResult"
                  value={form.productResult || ""}
                  onChange={handleChange}
                  placeholder="e.g. Passed"
                  style={inputBase}
                />
              </td>
            </tr>

            {/* Remark Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Remark:</td>
              <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="productRemark"
                  value={form.productRemark || ""}
                  onChange={handleChange}
                  placeholder="e.g. N/A"
                  style={inputBase}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={addItem}
        style={{ ...buttonStyle, marginBottom: "20px" }}
      >
        + Add Item
      </button>

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

export default ProductSpecification;
