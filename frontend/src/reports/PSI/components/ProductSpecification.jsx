import React, { useState } from "react";
import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const ProductSpecification = ({ form, handleChange, onPrev, onNext, quantityItems = [] }) => {
  const setField = (name, value) => handleChange({ target: { name, value } });

  // One fixed "Item No." row covers the first product; dynamic rows cover the rest.
  const [items, setItems] = useState(() => {
    const extra = quantityItems.filter(qi => (qi.itemName || qi.name)?.trim()).slice(1);
    const count = extra.length > 0 ? extra.length : 2;
    return Array.from({ length: count }, (_, i) => ({ id: i + 1 }));
  });
  const [nextId, setNextId] = useState(() => {
    const extra = quantityItems.filter(qi => (qi.itemName || qi.name)?.trim()).slice(1);
    return Math.max(extra.length, 2) + 1;
  });

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
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "left", fontWeight: "bold" }}>Check Point</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>Client's Spec.</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>Ref. Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>1# Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>2# Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}>3# Sample</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", fontWeight: "bold" }}></th>
            </tr>
          </thead>
          <tbody>
            {/* First product: Item No. row */}
            <tr>
              <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Item No.:</td>
              <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>
                <input
                  type="text"
                  name="item_0_no"
                  value={form['item_0_no'] || ""}
                  onChange={handleChange}
                  placeholder="e.g. 70800"
                  style={{ ...inputBase, textAlign: "center", fontWeight: "bold" }}
                />
              </td>
            </tr>
            {/* First product: Item Name row */}
            <tr>
              <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Item Name:</td>
              <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>
                <input
                  type="text"
                  name="productDescription"
                  value={form.productDescription || ""}
                  onChange={handleChange}
                  placeholder="e.g. chair"
                  style={{ ...inputBase, textAlign: "center", fontWeight: "bold" }}
                />
              </td>
            </tr>

            {/* Blank Editable Row */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="blank_row_0" value={form.blank_row_0 || ""} onChange={handleChange} placeholder="Check point" style={inputBase} />
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
                {/* Item No. row */}
                <tr>
                  <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Item No.:</td>
                  <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>
                    <input
                      type="text"
                      name={`item_${item.id}_no`}
                      value={form[`item_${item.id}_no`] || ""}
                      onChange={handleChange}
                      placeholder="e.g. 70801"
                      style={{ ...inputBase, textAlign: "center", fontWeight: "bold" }}
                    />
                  </td>
                </tr>
                {/* Item Name row */}
                <tr>
                  <td style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>Item Name:</td>
                  <td colSpan={6} style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>
                    <input
                      type="text"
                      name={`item_${item.id}_desc`}
                      value={form[`item_${item.id}_desc`] || ""}
                      onChange={handleChange}
                      placeholder="e.g. table"
                      style={{ ...inputBase, textAlign: "center", fontWeight: "bold" }}
                    />
                  </td>
                </tr>

                {/* Data Row */}
                <tr>
                  <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                    <input type="text" name={`item_${item.id}_name`} value={form[`item_${item.id}_name`] || ""} onChange={handleChange} placeholder="Check point" style={inputBase} />
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
                Result <span style={{color: colors.danger}}>*</span>
              </td>
              <td style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <select
                  name="productResult"
                  value={form.productResult || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", outline: "none" }}
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
                  name="productRemark"
                  value={form.productRemark || ""}
                  onChange={(e) => setField("productRemark", e.target.value)}
                  placeholder="Enter remark"
                  context="product specification comparison remark"
                  style={{ width: "100%", minHeight: "40px", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "12px", boxSizing: "border-box" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <button
          onClick={addItem}
          style={{ background: "transparent", color: colors.danger, border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          Add another Item
        </button>
        <button
          onClick={(e) => e.preventDefault()}
          style={{ background: "transparent", color: colors.danger, border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          Copy from Last Item
        </button>
        <button
          onClick={(e) => e.preventDefault()}
          style={{ background: "transparent", color: colors.danger, border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          Copy from One Item
        </button>
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
};

export default ProductSpecification;
