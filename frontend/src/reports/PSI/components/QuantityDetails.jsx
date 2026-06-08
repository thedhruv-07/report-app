import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { AddRowButton, RemoveRowButton } from '../../shared/components/RowButtons';

const th = (extra = {}) => ({
  padding: "5px 7px",
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  color: colors.header,
  fontWeight: 700,
  fontSize: "11px",
  textAlign: "center",
  whiteSpace: "nowrap",
  ...extra,
});

const td = (extra = {}) => ({
  border: "1px solid #e2e8f0",
  padding: "0",
  background: "#fff",
  ...extra,
});

const cellInput = (extra = {}) => ({
  width: "100%",
  height: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: colors.text,
  fontSize: "12px",
  padding: "5px 6px",
  textAlign: "center",
  fontFamily: "inherit",
  boxSizing: "border-box",
  ...extra,
});

const card = {
  background: "#fff",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  overflow: "hidden",
  marginBottom: "16px",
};

const cardHeader = {
  padding: "9px 16px",
  borderBottom: "1px solid #edf0f5",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const accentBar = {
  width: "3px", height: "14px",
  background: colors.primary,
  borderRadius: "2px",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: "11px", fontWeight: 700,
  color: colors.header,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const EMPTY_ROW = () => ({ item: "", n1:"", n2:"", n3:"", n4:"", n5:"", n6:"", n7:"", n8:"", n9:"", n10:"" });

export default function QuantityDetails({ items, onItemChange, onAddItem, onRemoveItem, form, handleChange, onPrev, onNext }) {
  const setField = (name, value) => handleChange({ target: { name, value } });

  const [cartonRows, setCartonRows] = useState(() => {
    if (Array.isArray(form.cartonRows) && form.cartonRows.length > 0) return form.cartonRows;
    const first = EMPTY_ROW();
    for (let i = 1; i <= 10; i++) first[`n${i}`] = form[`cartonNo${i}`] || "";
    first.item = form.selectedCartonItem || "";
    return [first];
  });

  const syncRows = (newRows) => {
    setCartonRows(newRows);
    setField("cartonRows", newRows);
  };
  const addCartonRow    = ()           => syncRows([...cartonRows, EMPTY_ROW()]);
  const removeCartonRow = (idx)        => { if (cartonRows.length > 1) syncRows(cartonRows.filter((_, i) => i !== idx)); };
  const updateCartonRow = (idx, k, v)  => syncRows(cartonRows.map((r, i) => i === idx ? { ...r, [k]: v } : r));

  const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const totals = {
    orderQty:      items.reduce((s, i) => s + toNum(i.orderQty), 0),
    packed:        items.reduce((s, i) => s + toNum(i.packedBreakdown), 0),
    unpacked:      items.reduce((s, i) => s + toNum(i.unpackedBreakdown), 0),
    unfinished:    items.reduce((s, i) => s + toNum(i.unfinishedBreakdown), 0),
    samplePacked:  items.reduce((s, i) => s + toNum(i.sampleSizePacked), 0),
    sampleUnpacked:items.reduce((s, i) => s + toNum(i.sampleSizeUnpacked), 0),
  };

  return (
    <>
      {/* ── Main Quantity Table ── */}
      <div style={card}>
        {/* Table header bar */}
        <div style={cardHeader}>
          <div style={accentBar} />
          <span style={cardTitle}>A. Quantity</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "36px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "64px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "64px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "64px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "64px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "32px" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th()} rowSpan={2}>#</th>
                <th style={th()} rowSpan={2}>P.O.</th>
                <th style={th({ textAlign: "left", paddingLeft: "8px" })} rowSpan={2}>Item</th>
                <th style={th()} rowSpan={2}>Qty</th>
                <th style={th()} rowSpan={2}>Qty/Carton</th>
                <th style={th()} rowSpan={2}>Carton</th>
                <th style={th()} rowSpan={2}>Selected Cartons</th>
                <th colSpan={3} style={th()}>Quantity Breakdown</th>
                <th colSpan={2} style={th()}>Sample Size</th>
                <th style={th()} rowSpan={2}>
                  <button
                    type="button"
                    onClick={onAddItem}
                    style={{ background: colors.primary, color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}
                  ><Plus size={12} /></button>
                </th>
              </tr>
              <tr>
                <th style={th({ fontSize: "10px" })}>Packed</th>
                <th style={th({ fontSize: "10px" })}>Unpacked</th>
                <th style={th({ fontSize: "10px" })}>Unfinished</th>
                <th style={th({ fontSize: "10px" })}>Packed</th>
                <th style={th({ fontSize: "10px" })}>Unpacked</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={td({ textAlign: "center", color: colors.textMuted, fontSize: "11px", padding: "5px 4px" })}>{idx + 1}</td>
                  <td style={td()}>
                    <input type="text" value={item.po || ""} onChange={(e) => onItemChange(idx, "po", e.target.value)}
                      style={cellInput({ textAlign: "left", paddingLeft: "6px" })} placeholder="P.O." />
                  </td>
                  <td style={td()}>
                    <input type="text" value={item.itemName || ""} onChange={(e) => onItemChange(idx, "itemName", e.target.value)}
                      style={cellInput({ textAlign: "left", paddingLeft: "6px" })} placeholder="Item no." />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.orderQty || ""} onChange={(e) => onItemChange(idx, "orderQty", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.qtyPerCarton || ""} onChange={(e) => onItemChange(idx, "qtyPerCarton", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.cartons || ""} onChange={(e) => onItemChange(idx, "cartons", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.selectedCartons || ""} onChange={(e) => onItemChange(idx, "selectedCartons", e.target.value)}
                      style={cellInput()} placeholder="0" />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.packedBreakdown || ""} onChange={(e) => onItemChange(idx, "packedBreakdown", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.unpackedBreakdown || ""} onChange={(e) => onItemChange(idx, "unpackedBreakdown", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.unfinishedBreakdown || ""} onChange={(e) => onItemChange(idx, "unfinishedBreakdown", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.sampleSizePacked || ""} onChange={(e) => onItemChange(idx, "sampleSizePacked", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td()}>
                    <input type="number" min="0" value={item.sampleSizeUnpacked || ""} onChange={(e) => onItemChange(idx, "sampleSizeUnpacked", e.target.value)}
                      style={cellInput()} />
                  </td>
                  <td style={td({ textAlign: "center", padding: "4px" })}>
                    <RemoveRowButton onClick={() => onRemoveItem(idx)} />
                  </td>
                </tr>
              ))}

              {/* Totals row */}
              <tr style={{ background: "#f1f5f9", fontWeight: 700 }}>
                <td colSpan={3} style={{ ...td({ background: "#f1f5f9", padding: "5px 8px" }), textAlign: "right", fontSize: "11px", color: colors.header }}>Total</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.primary }}>{totals.orderQty || "—"}</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.textMuted }}>—</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.textMuted }}>—</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.textMuted }}>—</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.success }}>{totals.packed || "—"}</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.warning }}>{totals.unpacked || "—"}</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.danger }}>{totals.unfinished || "—"}</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.primary }}>{totals.samplePacked || "—"}</td>
                <td style={{ ...td({ background: "#f1f5f9", padding: "5px 6px" }), textAlign: "center", color: colors.primary }}>{totals.sampleUnpacked || "—"}</td>
                <td style={{ ...td({ background: "#f1f5f9" }) }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Selected Cartons ── */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={accentBar} />
          <span style={cardTitle}>Selected Cartons</span>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <input
              type="number"
              name="selectedCartonsCount"
              value={form.selectedCartonsCount || ""}
              onChange={handleChange}
              placeholder="0"
              style={{ width: "70px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "5px 8px", fontSize: "13px", textAlign: "center", color: colors.text, background: "#fff", outline: "none", fontFamily: "inherit" }}
            />
            <span style={{ fontSize: "12px", color: colors.textLight }}>Cartons were selected randomly on site.</span>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: colors.text, cursor: "pointer", marginBottom: "8px" }}>
            <input
              type="checkbox"
              name="noCartonNumberInMark"
              checked={!!form.noCartonNumberInMark}
              onChange={(e) => setField("noCartonNumberInMark", e.target.checked)}
              style={{ width: "14px", height: "14px", accentColor: colors.primary }}
            />
            No carton number in shipping mark.
          </label>
          <div style={{ fontSize: "11px", color: colors.danger, fontWeight: 600, marginBottom: "10px" }}>
            WARNING: Rows which does not select Item No. will be ignored to save.
          </div>

          {/* N1–N10 carton numbers grid */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "12px", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ ...th({ textAlign: "left", paddingLeft: "8px", width: "120px" }) }}>Item</th>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <th key={n} style={th({ width: "64px" })}>N{n}</th>
                  ))}
                  <th style={th({ width: "32px" })}>
                    <button type="button" onClick={addCartonRow}
                      style={{ background: colors.primary, color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                      <Plus size={12} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {cartonRows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ ...td({ padding: "0" }), textAlign: "left" }}>
                      <select
                        value={row.item || ""}
                        onChange={(e) => updateCartonRow(idx, "item", e.target.value)}
                        style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", padding: "5px 6px", fontFamily: "inherit", outline: "none", cursor: "pointer" }}
                      >
                        <option value=""></option>
                        {items.map((item, i) => (
                          <option key={i} value={item.itemName || `Item ${i + 1}`}>{item.itemName || `Item ${i + 1}`}</option>
                        ))}
                      </select>
                    </td>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <td key={n} style={td()}>
                        <input
                          type="text"
                          value={row[`n${n}`] || ""}
                          onChange={(e) => updateCartonRow(idx, `n${n}`, e.target.value)}
                          style={cellInput()}
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td style={td({ textAlign: "center", padding: "4px" })}>
                      <RemoveRowButton onClick={() => removeCartonRow(idx)} disabled={cartonRows.length <= 1} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Result + Remark ── */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={accentBar} />
          <span style={cardTitle}>Result & Remarks</span>
        </div>
        <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: colors.header, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Result</div>
            <select
              name="quantityResult"
              value={form.quantityResult || ""}
              onChange={handleChange}
              style={{
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "7px 10px",
                fontSize: "12px",
                fontFamily: "inherit",
                background: "#fff",
                color: form.quantityResult === "Failed" ? colors.danger : form.quantityResult === "Passed" ? colors.success : form.quantityResult === "Pending" ? colors.warning : colors.text,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Select Result</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: colors.header, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remark</div>
            <SmartTextarea
              name="quantityRemark"
              value={form.quantityRemark || ""}
              onChange={(e) => setField("quantityRemark", e.target.value)}
              placeholder="Enter quantity inspection remarks..."
              context="quantity inspection findings and packing observations"
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", color: colors.text, background: "#fff", minHeight: "70px", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </>
  );
}
