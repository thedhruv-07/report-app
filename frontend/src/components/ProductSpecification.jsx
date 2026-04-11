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

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 8: D. PRODUCT SPECIFICATION
      </h2>

      {/* Merged Product Specification Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <td colSpan="7" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                D. PRODUCT SPECIFICATION
              </td>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}></th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}>Client's Spec.</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}>Ref. Sample</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}>1# Sample</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}>2# Sample</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}>3# Sample</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontWeight: "bold" }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "100px" }}>Item No.:</td>
              <td colSpan="6" style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="productDescription"
                  value={form.productDescription || ""}
                  onChange={handleChange}
                  placeholder="30B nut forming machine (Model: 30B-6S-40)"
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
            
            {/* Blank Editable Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="blank_row_0" value={form.blank_row_0 || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="blank_row_c0" value={form.blank_row_c0 || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="blank_row_c1" value={form.blank_row_c1 || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="blank_row_c2" value={form.blank_row_c2 || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="blank_row_c3" value={form.blank_row_c3 || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="blank_row_c4" value={form.blank_row_c4 || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                <button
                  onClick={() => removeItem(1)}
                  disabled={true}
                  style={{
                    padding: "4px 8px",
                    background: colors.textMuted,
                    color: colors.text,
                    border: "none",
                    borderRadius: "2px",
                    cursor: "not-allowed",
                    fontSize: "11px"
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>

            {/* Render Item rows for each item (description + data) */}
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {/* Item No. Description Row */}
                <tr>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "100px" }}>Item No.:</td>
                  <td colSpan="6" style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input
                      type="text"
                      name={`item_${item.id}_desc`}
                      value={form[`item_${item.id}_desc`] || ""}
                      onChange={handleChange}
                      placeholder="e.g. 30B nut forming machine (Model: 30B-6S-40)"
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
                
                {/* Editable Data Row */}
                <tr>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input type="text" name={`item_${item.id}_name`} value={form[`item_${item.id}_name`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input type="text" name={`item_${item.id}_c0`} value={form[`item_${item.id}_c0`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input type="text" name={`item_${item.id}_c1`} value={form[`item_${item.id}_c1`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input type="text" name={`item_${item.id}_c2`} value={form[`item_${item.id}_c2`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input type="text" name={`item_${item.id}_c3`} value={form[`item_${item.id}_c3`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <input type="text" name={`item_${item.id}_c4`} value={form[`item_${item.id}_c4`] || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, textAlign: "center", boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      style={{
                        padding: "4px 8px",
                        background: items.length === 1 ? colors.textMuted : colors.danger,
                        color: colors.text,
                        border: "none",
                        borderRadius: "2px",
                        cursor: items.length === 1 ? "not-allowed" : "pointer",
                        fontSize: "11px"
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
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Result:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="productResult"
                  value={form.productResult || ""}
                  onChange={handleChange}
                  placeholder="e.g. Passed"
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
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
            </tr>

            {/* Remark Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Remark:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input
                  type="text"
                  name="productRemark"
                  value={form.productRemark || ""}
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
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <button 
        onClick={addItem} 
        style={{ 
          ...buttonStyle,
          marginBottom: "20px" 
        }}
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
