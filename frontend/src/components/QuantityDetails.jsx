import { inputStyle, buttonStyle } from "../styles";

export default function QuantityDetails({ items, onItemChange, onAddItem, onRemoveItem, form, handleChange, onPrev, onNext }) {
  return (
    <>
      <h3 style={{ marginBottom: "20px" }}>V. QUANTITY</h3>

      {/* Quantity Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "left" }}>P.O.</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "left" }}>Item</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center" }}>Order Qty</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center" }}>Qty/Carton</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center" }}>Cartons</th>
              <th colSpan="3" style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center" }}>Quantity Breakdown</th>
              <th colSpan="2" style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center" }}>Sample Size</th>
              <th colSpan="2" style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center" }}>Unit Sets</th>
            </tr>
            <tr>
              <th colSpan="5" style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}></th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Packed</th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Unpacked</th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Unfinished</th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Packed</th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Unpacked</th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Packed</th>
              <th style={{ padding: "4px", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", fontSize: "11px" }}>Unpacked</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                  <input
                    type="text"
                    value={item.po || ""}
                    onChange={(e) => onItemChange(idx, "po", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                  <input
                    type="text"
                    value={item.itemName || ""}
                    onChange={(e) => onItemChange(idx, "itemName", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.orderQty || ""}
                    onChange={(e) => onItemChange(idx, "orderQty", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.qtyPerCarton || ""}
                    onChange={(e) => onItemChange(idx, "qtyPerCarton", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.cartons || ""}
                    onChange={(e) => onItemChange(idx, "cartons", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.packedBreakdown || ""}
                    onChange={(e) => onItemChange(idx, "packedBreakdown", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.unpackedBreakdown || ""}
                    onChange={(e) => onItemChange(idx, "unpackedBreakdown", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.unfinishedBreakdown || ""}
                    onChange={(e) => onItemChange(idx, "unfinishedBreakdown", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.sampleSizePacked || ""}
                    onChange={(e) => onItemChange(idx, "sampleSizePacked", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.sampleSizeUnpacked || ""}
                    onChange={(e) => onItemChange(idx, "sampleSizeUnpacked", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.unitSetsPacked || ""}
                    onChange={(e) => onItemChange(idx, "unitSetsPacked", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    value={item.unitSetsUnpacked || ""}
                    onChange={(e) => onItemChange(idx, "unitSetsUnpacked", e.target.value)}
                    style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <button
                    onClick={() => onRemoveItem(idx)}
                    style={{
                      padding: "4px 8px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Button */}
      <button onClick={onAddItem} style={{ ...buttonStyle, marginBottom: "20px" }}>
        + Add Item
      </button>

      {/* Selected Cartons */}
      <div style={{ marginBottom: "20px", padding: "15px", background: "#0f172a", border: "1px solid #3a4a5c", borderRadius: "8px" }}>
        <h4 style={{ marginBottom: "10px", fontWeight: "bold", color: "#fff" }}>Selected Cartons:</h4>
        <p style={{ color: "#8a9aaa", fontSize: "13px", marginBottom: "10px" }}>
          Cartons were selected randomly on site No. carton number in shipping mark.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <input
              key={num}
              type="text"
              name={`cartonNo${num}`}
              value={form[`cartonNo${num}`] || ""}
              onChange={handleChange}
              placeholder="-"
              style={{ ...inputStyle, textAlign: "center" }}
            />
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: "#fff" }}>Result:</label>
        <select
          name="quantityResult"
          value={form.quantityResult || ""}
          onChange={handleChange}
          style={{
            ...inputStyle,
            color: form.quantityResult === "Fail" ? "#ef4444" : form.quantityResult === "Pass" ? "#10b981" : "#fff",
            fontWeight: "bold"
          }}
        >
          <option value="">Select Result</option>
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
        </select>
      </div>

      {/* Remark */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: "#fff" }}>Remark:</label>
        <textarea
          name="quantityRemark"
          value={form.quantityRemark || ""}
          onChange={handleChange}
          placeholder="Enter remarks..."
          style={{ ...inputStyle, minHeight: "80px" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
