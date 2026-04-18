import { inputStyle, buttonStyle, colors, sectionHeaderStyle } from "../styles";
import SmartTextarea from "./SmartTextarea";

export default function QuantityDetails({ items, onItemChange, onAddItem, onRemoveItem, form, handleChange, onPrev, onNext }) {
  const setField = (name, value) => handleChange({ target: { name, value } });
  const toNum = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const totals = {
    orderQty: items.reduce((sum, item) => sum + toNum(item.orderQty), 0),
    packed: items.reduce((sum, item) => sum + toNum(item.packedBreakdown), 0),
    unpacked: items.reduce((sum, item) => sum + toNum(item.unpackedBreakdown), 0),
    unfinished: items.reduce((sum, item) => sum + toNum(item.unfinishedBreakdown), 0),
    samplePacked: items.reduce((sum, item) => sum + toNum(item.sampleSizePacked), 0),
    sampleUnpacked: items.reduce((sum, item) => sum + toNum(item.sampleSizeUnpacked), 0),
  };

  return (
    <>
      <h3 style={{ ...sectionHeaderStyle, color: colors.text, marginBottom: "20px" }}>A. QUANTITY</h3>

      {/* Quantity Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th colSpan="11" style={{ padding: "8px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.primary, textAlign: "left", fontWeight: "700", fontSize: "16px" }}>
                A. QUANTITY
              </th>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left" }}>P.O.</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left" }}>Item</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center" }}>Order Qty</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center" }}>Qty/Carton</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center" }}>Cartons</th>
              <th colSpan="3" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center" }}>Quantity Breakdown</th>
              <th colSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center" }}>Sample Size</th>
              <th rowSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center" }}>Action</th>
            </tr>
            <tr>
              <th colSpan="5" style={{ padding: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}></th>
              <th style={{ padding: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontSize: "11px" }}>Packed</th>
              <th style={{ padding: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontSize: "11px" }}>Unpacked</th>
              <th style={{ padding: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontSize: "11px" }}>Unfinished</th>
              <th style={{ padding: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontSize: "11px" }}>Packed</th>
              <th style={{ padding: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", fontSize: "11px" }}>Unpacked</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                  <input
                    type="text"
                    value={item.po || ""}
                    onChange={(e) => onItemChange(idx, "po", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                  <input
                    type="text"
                    value={item.itemName || ""}
                    onChange={(e) => onItemChange(idx, "itemName", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.orderQty || ""}
                    onChange={(e) => onItemChange(idx, "orderQty", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.qtyPerCarton || ""}
                    onChange={(e) => onItemChange(idx, "qtyPerCarton", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.cartons || ""}
                    onChange={(e) => onItemChange(idx, "cartons", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.packedBreakdown || ""}
                    onChange={(e) => onItemChange(idx, "packedBreakdown", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.unpackedBreakdown || ""}
                    onChange={(e) => onItemChange(idx, "unpackedBreakdown", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.unfinishedBreakdown || ""}
                    onChange={(e) => onItemChange(idx, "unfinishedBreakdown", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.sampleSizePacked || ""}
                    onChange={(e) => onItemChange(idx, "sampleSizePacked", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={item.sampleSizeUnpacked || ""}
                    onChange={(e) => onItemChange(idx, "sampleSizeUnpacked", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <button
                    onClick={() => onRemoveItem(idx)}
                    style={{
                      padding: "4px 8px",
                      background: colors.danger,
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.target.opacity = "0.9"}
                    onMouseLeave={(e) => e.target.opacity = "1"}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            <tr>
              <td colSpan="2" style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "right", color: colors.text, fontWeight: "bold" }}>
                Total:
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text, fontWeight: "bold" }}>
                {totals.orderQty}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text }}>
                -
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text }}>
                -
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text, fontWeight: "bold" }}>
                {totals.packed}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text, fontWeight: "bold" }}>
                {totals.unpacked}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.danger, fontWeight: "bold" }}>
                {totals.unfinished}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text, fontWeight: "bold" }}>
                {totals.samplePacked}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", color: colors.text, fontWeight: "bold" }}>
                {totals.sampleUnpacked}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Item Button */}
      <button 
        onClick={onAddItem} 
        style={{ ...buttonStyle, marginBottom: "20px" }}
        onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.4)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)"; }}
      >
        + Add Item
      </button>

      {/* Selected Cartons */}
      <div style={{ marginBottom: "20px", padding: "15px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
        <h4 style={{ marginBottom: "10px", fontWeight: "600", color: colors.text }}>Selected Cartons:</h4>
        <input
          type="number"
          name="selectedCartonsCount"
          value={form.selectedCartonsCount || ""}
          onChange={handleChange}
          placeholder="0"
          style={{ ...inputStyle, marginBottom: "10px", maxWidth: "120px", textAlign: "center", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
        />
        <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "10px" }}>
          Cartons were selected randomly on site No. carton number in shipping mark.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <input
              key={num}
              type="text"
              name={`cartonNo${num}`}
              value={form[`cartonNo${num}`] || ""}
              onChange={handleChange}
              placeholder="-"
              style={{ ...inputStyle, textAlign: "center", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
            />
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "600", display: "block", marginBottom: "10px", color: colors.text, fontSize: "14px" }}>Result:</label>
        <select
          name="quantityResult"
          value={form.quantityResult || ""}
          onChange={handleChange}
          style={{
            ...inputStyle,
            background: colors.surface,
            color: form.quantityResult === "Failed" ? colors.danger : form.quantityResult === "Passed" ? colors.success : form.quantityResult === "Pending" ? colors.warning : colors.text,
            fontWeight: "bold",
            border: `2px solid ${colors.border}`,
            borderRadius: "8px"
          }}
        >
          <option value="">Select Result</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Remark */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "600", display: "block", marginBottom: "10px", color: colors.text, fontSize: "14px" }}>Remark:</label>
        <SmartTextarea
          name="quantityRemark"
          value={form.quantityRemark || ""}
          onChange={(e) => setField("quantityRemark", e.target.value)}
          placeholder="Enter remarks..."
          context="quantity inspection findings and packing observations"
          style={{ ...inputStyle, minHeight: "80px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          onClick={onPrev} 
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.4)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)"; }}
        >
          Back
        </button>
        <button 
          onClick={onNext} 
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.4)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)"; }}
        >
          Next
        </button>
      </div>
    </>
  );
}
