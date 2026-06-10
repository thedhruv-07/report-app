import React, { useState, useEffect, lazy, Suspense } from 'react';
import { inputStyle, colors, sectionHeaderStyle } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { AddRowButton, RemoveRowButton, AddIconButton } from '../../shared/components/RowButtons';
import { Lock } from 'lucide-react';

const DefectPhotosPanel = lazy(() => import('./DefectPhotosPanel'));

const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const newRow  = () => ({ id: Date.now() + Math.random(), description: "", critical: "", major: "", minor: "" });
const newGroup = (itemName = "", sampleSize = "") => ({ id: Date.now() + Math.random(), itemName, sampleSize, rows: [newRow()] });

export default function WorkmanshipDefects({ form, handleChange, onPrev, onNext, onWorkmanshipDefectsChange, onWorkmanshipPhotosChange, items, lockedAql = false }) {
  const setField = (name, value) => handleChange({ target: { name, value } });

  /* ── grouped defect state ── */
  const [groups, setGroups] = useState(() => {
    if (Array.isArray(form.workmanshipDefects) && form.workmanshipDefects.length > 0) {
      // migrate flat → grouped
      const map = {};
      form.workmanshipDefects.forEach(d => {
        const key = d.itemName || "Item";
        if (!map[key]) map[key] = newGroup(d.itemName, d.sampleSize || "");
        else map[key].rows.push({ id: d.id || Date.now() + Math.random(), description: d.description || "", critical: d.critical || "", major: d.major || "", minor: d.minor || "" });
        Object.assign(map[key].rows[map[key].rows.length - 1], { description: d.description || "", critical: d.critical || "", major: d.major || "", minor: d.minor || "" });
      });
      return Object.values(map);
    }
    if (Array.isArray(items) && items.length > 0) {
      return items.map(item => newGroup(item.itemName || item.name || "", item.sampleSizePacked || form.sampleSizeWM || ""));
    }
    return [newGroup("", form.sampleSizeWM || "")];
  });

  const [defectPhotos, setDefectPhotos] = useState(() => {
    if (form.workmanshipPhotos && Array.isArray(form.workmanshipPhotos) && form.workmanshipPhotos.length > 0) return form.workmanshipPhotos;
    return [{ id: Date.now(), preview: "", fileName: "", description: "" }];
  });

  // Sync flat defects to parent
  useEffect(() => {
    const flat = groups.flatMap(g => g.rows.map(r => ({ id: r.id, itemName: g.itemName, sampleSize: g.sampleSize, description: r.description, critical: r.critical, major: r.major, minor: r.minor })));
    onWorkmanshipDefectsChange(flat);
  }, [groups, onWorkmanshipDefectsChange]);

  useEffect(() => { onWorkmanshipPhotosChange(defectPhotos); }, [defectPhotos, onWorkmanshipPhotosChange]);

  /* ── group actions ── */
  const addGroup    = ()      => setGroups(g => [...g, newGroup()]);
  const removeGroup = (gid)   => setGroups(g => g.length > 1 ? g.filter(x => x.id !== gid) : g);
  const updateGroup = (gid, k, v) => setGroups(g => g.map(x => x.id === gid ? { ...x, [k]: v } : x));

  /* ── row actions ── */
  const addRow    = (gid)        => setGroups(g => g.map(x => x.id === gid ? { ...x, rows: [...x.rows, newRow()] } : x));
  const removeRow = (gid, rid)   => setGroups(g => g.map(x => x.id === gid ? { ...x, rows: x.rows.length > 1 ? x.rows.filter(r => r.id !== rid) : x.rows } : x));
  const updateRow = (gid, rid, k, v) => setGroups(g => g.map(x => x.id === gid ? { ...x, rows: x.rows.map(r => r.id === rid ? { ...r, [k]: v } : r) } : x));

  /* ── defect photo actions ── */
  const addDefectPhoto    = ()      => setDefectPhotos(p => [...p, { id: Date.now(), preview: "", fileName: "", description: "" }]);
  const removeDefectPhoto = (id)    => setDefectPhotos(p => p.length <= 1 ? p.map(x => x.id === id ? { ...x, preview: "", fileName: "", description: "" } : x) : p.filter(x => x.id !== id));
  const updateDefectPhoto = (id, u) => setDefectPhotos(p => p.map(x => x.id === id ? { ...x, ...u } : x));
  const handleDefectPhotoUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateDefectPhoto(id, { preview: reader.result, fileName: file.name });
    reader.readAsDataURL(file);
  };

  /* ── auto totals ── */
  const allRows = groups.flatMap(g => g.rows);
  const autoTotals = {
    critical: allRows.reduce((s, r) => s + toNum(r.critical), 0),
    major:    allRows.reduce((s, r) => s + toNum(r.major),    0),
    minor:    allRows.reduce((s, r) => s + toNum(r.minor),    0),
  };

  const cellSt = { border: `1px solid ${colors.border}`, padding: "0", background: colors.surface, textAlign: "center" };
  const numIn  = (name, value, w = "100%") => (
    <input type="number" min="0" name={name} value={value} onChange={handleChange}
      style={{ width: w, border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center", padding: "6px 0" }} />
  );
  const txtIn = (name, value, w = "100%", placeholder = "") => (
    <input type="text" name={name} value={value} onChange={handleChange} placeholder={placeholder}
      style={{ width: w, border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", padding: "6px" }} />
  );
  const lockedVal = (value) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px", fontSize: "12px", color: colors.text, fontWeight: 600 }}>
      {value || "—"}
      <Lock size={10} color="#7c3aed" title="Set by CS — not editable" />
    </span>
  );

  return (
    <>
      {/* ── AQL Settings Table ── */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ ...sectionHeaderStyle, marginBottom: "0px", padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>AQL</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text }}></th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "130px" }}>AQL</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "100px" }}>Accepted</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "110px" }}>Total Found</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "120px" }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Inspection Level + Critical */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text, width: "140px" }}>
                Inspection Level {lockedAql && <Lock size={9} color="#7c3aed" style={{ verticalAlign: "middle", marginLeft: "3px" }} />}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: lockedAql ? "#f5f3ff" : colors.surface }}>
                {lockedAql ? lockedVal(form.inspectionLevelWM || "Level II") : txtIn("inspectionLevelWM", form.inspectionLevelWM || "Level II")}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text }}>
                <span style={{ fontWeight: "bold" }}>Critical: </span>
                {lockedAql ? lockedVal(form.aqlCriticalWM || "Not Allowed") : txtIn("aqlCriticalWM", form.aqlCriticalWM || "Not Allowed", "65%")}
              </td>
              <td style={cellSt}>{numIn("acceptedCritical", form.acceptedCritical || "0")}</td>
              <td style={cellSt}>{numIn("totalFoundCritical", form.totalFoundCritical || "0")}</td>
              <td style={{ ...cellSt, padding: "4px" }}>
                <select name="result1WM" value={form.result1WM || ""} onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: form.result1WM === "Pass" ? colors.success : form.result1WM === "Fail" ? colors.danger : colors.text, fontSize: "12px", outline: "none", textAlign: "center", cursor: "pointer", fontWeight: 600 }}>
                  <option value="">—</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
            {/* Row 2: Inspection Standard + Major */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text }}>Inspection Standard</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                {txtIn("inspectionStandardWM", form.inspectionStandardWM || "ANSI/ASQ Z1.4")}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text }}>
                <span style={{ fontWeight: "bold" }}>Major: </span>
                {lockedAql ? lockedVal(form.aqlMajorWM || "1.5") : txtIn("aqlMajorWM", form.aqlMajorWM || "1.5", "65%")}
              </td>
              <td style={cellSt}>{numIn("acceptedMajor", form.acceptedMajor || "0")}</td>
              <td style={cellSt}>{numIn("totalFoundMajor", form.totalFoundMajor || "0")}</td>
              <td style={{ ...cellSt, padding: "4px" }}>
                <select name="result2WM" value={form.result2WM || ""} onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: form.result2WM === "Pass" ? colors.success : form.result2WM === "Fail" ? colors.danger : colors.text, fontSize: "12px", outline: "none", textAlign: "center", cursor: "pointer", fontWeight: 600 }}>
                  <option value="">—</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
            {/* Row 3: Sampling Plan + Minor */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text }}>Sampling Plan</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                {txtIn("samplingPlanWM", form.samplingPlanWM || "Normal, Single")}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text }}>
                <span style={{ fontWeight: "bold" }}>Minor: </span>
                {lockedAql ? lockedVal(form.aqlMinorWM || "4.0") : txtIn("aqlMinorWM", form.aqlMinorWM || "4.0", "65%")}
              </td>
              <td style={cellSt}>{numIn("acceptedMinor", form.acceptedMinor || "0")}</td>
              <td style={cellSt}>{numIn("totalFoundMinor", form.totalFoundMinor || "0")}</td>
              <td style={{ ...cellSt, padding: "4px" }}>
                <select name="result3WM" value={form.result3WM || ""} onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: form.result3WM === "Pass" ? colors.success : form.result3WM === "Fail" ? colors.danger : colors.text, fontSize: "12px", outline: "none", textAlign: "center", cursor: "pointer", fontWeight: 600 }}>
                  <option value="">—</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>
            </tr>
            {/* Row 4: Sample Size */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text }}>
                Sample Size {lockedAql && <Lock size={9} color="#7c3aed" style={{ verticalAlign: "middle", marginLeft: "3px" }} />}
              </td>
              <td colSpan={5} style={{ padding: "8px", border: `1px solid ${colors.border}`, background: lockedAql ? "#f5f3ff" : colors.surface }}>
                {lockedAql ? lockedVal(form.sampleSizeWM || "315") : txtIn("sampleSizeWM", form.sampleSizeWM || "315")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Workmanship Defects ── */}
      <h3 style={{ marginBottom: "0px", ...sectionHeaderStyle, padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>Workmanship</h3>

      <div style={{ marginBottom: "15px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, width: "36px", textAlign: "center" }}>No.</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left" }}>Defect</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "80px" }}>Critical</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "80px" }}>Major</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "80px" }}>Minor</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "60px" }}></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              <React.Fragment key={group.id}>
                {/* Item header row */}
                <tr style={{ background: colors.surfaceAlt }}>
                  <td style={{ padding: "6px 8px", border: `1px solid ${colors.border}`, textAlign: "center", fontWeight: 700, color: colors.primary, fontSize: "12px" }}>#{gi + 1}</td>
                  <td style={{ padding: "4px 8px", border: `1px solid ${colors.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <select
                        value={group.itemName || ""}
                        onChange={(e) => updateGroup(group.id, "itemName", e.target.value)}
                        style={{ border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "3px 6px", fontSize: "12px", color: colors.text, background: "#fff", outline: "none", cursor: "pointer", fontFamily: "inherit", flex: 1, maxWidth: "220px" }}
                      >
                        <option value="">— Select Item —</option>
                        {Array.isArray(items) && items.map((item, ii) => (
                          <option key={ii} value={item.itemName || `Item ${ii + 1}`}>
                            {item.itemName || `Item ${ii + 1}`}{item.po ? ` (${item.po})` : ""}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: "11px", color: colors.textMuted, whiteSpace: "nowrap" }}>
                        Sample size:&nbsp;
                        <input
                          type="text"
                          value={group.sampleSize || ""}
                          onChange={(e) => updateGroup(group.id, "sampleSize", e.target.value)}
                          placeholder="0"
                          style={{ width: "40px", border: "none", borderBottom: `1px solid ${colors.border}`, outline: "none", fontSize: "11px", textAlign: "center", fontFamily: "inherit", color: colors.text, background: "transparent" }}
                        /> pcs
                      </span>
                    </div>
                  </td>
                  <td colSpan={3} style={{ border: `1px solid ${colors.border}`, background: colors.surfaceAlt }}></td>
                  <td style={{ border: `1px solid ${colors.border}`, padding: "4px 6px", background: colors.surfaceAlt }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                      <RemoveRowButton onClick={() => removeGroup(group.id)} disabled={groups.length <= 1} />
                      <AddIconButton onClick={() => addRow(group.id)} size={18} />
                    </div>
                  </td>
                </tr>

                {/* Defect rows for this item */}
                {group.rows.map((row, ri) => (
                  <tr key={row.id} style={{ background: colors.surface }}>
                    <td style={{ padding: "6px", border: `1px solid ${colors.border}`, textAlign: "center", color: colors.textMuted, fontSize: "11px" }}>{ri + 1}</td>
                    <td style={{ padding: "4px 8px", border: `1px solid ${colors.border}` }}>
                      <SmartTextarea
                        value={row.description}
                        onChange={(e) => updateRow(group.id, row.id, "description", e.target.value)}
                        placeholder="Defect description..."
                        context="workmanship quality defect description"
                        style={{ width: "100%", padding: "4px", background: "transparent", color: colors.text, border: "none", fontSize: "12px", outline: "none", fontFamily: "inherit", minHeight: "28px" }}
                      />
                    </td>
                    <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <input type="number" min="0" value={row.critical}
                        onChange={(e) => updateRow(group.id, row.id, "critical", e.target.value)}
                        style={{ width: "100%", padding: "10px 0", background: "transparent", color: colors.text, border: "none", textAlign: "center", outline: "none" }} />
                    </td>
                    <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <input type="number" min="0" value={row.major}
                        onChange={(e) => updateRow(group.id, row.id, "major", e.target.value)}
                        style={{ width: "100%", padding: "10px 0", background: "transparent", color: colors.text, border: "none", textAlign: "center", outline: "none" }} />
                    </td>
                    <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <input type="number" min="0" value={row.minor}
                        onChange={(e) => updateRow(group.id, row.id, "minor", e.target.value)}
                        style={{ width: "100%", padding: "10px 0", background: "transparent", color: colors.text, border: "none", textAlign: "center", outline: "none" }} />
                    </td>
                    <td style={{ padding: "6px", border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <RemoveRowButton onClick={() => removeRow(group.id, row.id)} disabled={group.rows.length <= 1} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Total Found */}
            <tr>
              <td colSpan={2} style={{ padding: "8px 12px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text, textAlign: "right" }}>Total Found:</td>
              <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: "#f8fafc" }}>
                <span style={{ display: "block", padding: "8px 0", fontWeight: "bold", color: colors.text }}>{autoTotals.critical}</span>
              </td>
              <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: "#f8fafc" }}>
                <span style={{ display: "block", padding: "8px 0", fontWeight: "bold", color: colors.text }}>{autoTotals.major}</span>
              </td>
              <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: "#f8fafc" }}>
                <span style={{ display: "block", padding: "8px 0", fontWeight: "bold", color: colors.text }}>{autoTotals.minor}</span>
              </td>
              <td style={{ border: `1px solid ${colors.border}`, background: colors.headerBg }}></td>
            </tr>

            {/* Accepted */}
            <tr>
              <td colSpan={2} style={{ padding: "8px 12px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text, textAlign: "right" }}>Accepted:</td>
              <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: "#f8fafc" }}>
                <input type="number" min="0" name="acceptedCritical" value={form.acceptedCritical || ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 0", border: "none", textAlign: "center", background: "transparent", color: colors.text, fontWeight: "bold", outline: "none" }} />
              </td>
              <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: "#f8fafc" }}>
                <input type="number" min="0" name="acceptedMajor" value={form.acceptedMajor || ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 0", border: "none", textAlign: "center", background: "transparent", color: colors.text, fontWeight: "bold", outline: "none" }} />
              </td>
              <td style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: "#f8fafc" }}>
                <input type="number" min="0" name="acceptedMinor" value={form.acceptedMinor || ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 0", border: "none", textAlign: "center", background: "transparent", color: colors.text, fontWeight: "bold", outline: "none" }} />
              </td>
              <td style={{ border: `1px solid ${colors.border}`, background: colors.headerBg }}></td>
            </tr>

            {/* Sample Size */}
            <tr>
              <td colSpan={2} style={{ padding: "8px 12px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text, textAlign: "right" }}>Sample Size:</td>
              <td colSpan={3} style={{ padding: "0", border: `1px solid ${colors.border}`, textAlign: "center", background: lockedAql ? "#f5f3ff" : "#f8fafc" }}>
                {lockedAql
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "8px 0", fontWeight: "bold", color: colors.text, fontSize: "12px" }}>{form.sampleSizeWM || "315"} <Lock size={10} color="#7c3aed" /></span>
                  : <input type="text" name="sampleSizeWM" value={form.sampleSizeWM || ""} onChange={handleChange}
                      style={{ width: "100%", padding: "8px 0", border: "none", textAlign: "center", background: "transparent", color: colors.text, fontWeight: "bold", outline: "none" }} />
                }
              </td>
              <td style={{ border: `1px solid ${colors.border}`, background: colors.headerBg }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add other Item */}
      <div style={{ paddingBottom: "20px" }}>
        <AddRowButton onClick={addGroup} label="Add other Item" />
      </div>

      {/* Notes Section */}
      <div style={{ marginBottom: "20px", padding: "15px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
        <p style={{ color: colors.textMuted, fontSize: "12px", marginBottom: "0" }}>
          <strong>Notes:</strong> A Defective is defined as a unit of product that contains one or more defects. A Defect is defined as any non-conformance of the inspected unit of product with specified requirement. A single defect is taken into account per each defective unit; only one most critical classification per defective unit.
        </p>
      </div>

      {/* Result and Remark */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ ...sectionHeaderStyle, marginBottom: "10px", padding: "8px 10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "13px" }}>Result</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px" }}>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px", color: colors.text, fontSize: "12px" }}>Result *</label>
            <select name="workmanshipResult" value={form.workmanshipResult || ""} onChange={handleChange}
              style={{ ...inputStyle, color: form.workmanshipResult === "Failed" ? colors.danger : form.workmanshipResult === "Passed" ? colors.success : form.workmanshipResult === "Pending" ? colors.warning : colors.text, fontWeight: "bold" }}>
              <option value="">Select Result</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px", color: colors.text, fontSize: "12px" }}>Remarks</label>
            <SmartTextarea name="workmanshipRemark" value={form.workmanshipRemark || ""}
              onChange={(e) => setField("workmanshipRemark", e.target.value)}
              placeholder="Enter remarks..." context="overall workmanship inspection summary and findings"
              style={{ ...inputStyle }} />
          </div>
        </div>
      </div>

      {/* Defect Photos Section */}
      <Suspense fallback={<div style={{ marginBottom: '20px', color: colors.textMuted }}>Loading defect photos…</div>}>
        <DefectPhotosPanel
          defectPhotos={defectPhotos}
          removeDefectPhoto={removeDefectPhoto}
          updateDefectPhoto={updateDefectPhoto}
          handleDefectPhotoUpload={handleDefectPhotoUpload}
          addDefectPhoto={addDefectPhoto}
        />
      </Suspense>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </>
  );
}
