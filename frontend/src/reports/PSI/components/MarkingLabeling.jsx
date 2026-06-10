import { useState } from "react";
import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const MarkingLabeling = ({ form, handleChange, onPrev, onNext }) => {
  const setField = (name, value) => handleChange({ target: { name, value } });
  
  const [barcodeItems, setBarcodeItems] = useState([{ id: 1 }]);
  const [nextBarcodeId, setNextBarcodeId] = useState(2);
  const [certItems, setCertItems] = useState([{ id: 1 }]);
  const [nextCertId, setNextCertId] = useState(2);

  const addBarcode = () => {
    const newId = nextBarcodeId;
    setBarcodeItems([...barcodeItems, { id: newId }]);
    setNextBarcodeId(newId + 1);
    // Auto-seed location from inspection site
    if (form.inspectionLocation && !form[`barcode_location_${newId}`]) {
      setField(`barcode_location_${newId}`, form.inspectionLocation);
    }
  };
  const removeBarcode = (id) => { if (barcodeItems.length > 1) setBarcodeItems(barcodeItems.filter(item => item.id !== id)); };

  const addCert = () => { setCertItems([...certItems, { id: nextCertId }]); setNextCertId(nextCertId + 1); };
  const removeCert = (id) => { if (certItems.length > 1) setCertItems(certItems.filter(item => item.id !== id)); };

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

  const getResultColor = (value) => {
    const v = String(value || "").trim().toLowerCase();
    if (v.includes("fail")) return "#CC0000";
    if (v.includes("pass")) return "#228B22";
    return colors.text; 
  };

  const markColor = getResultColor(form.marking_result_final);

  const barcodeOptions = [
    "Fillable", "Item number", "PO number", "Barcode", "Rating label", "Washing label", 
    "Warning word/marking", "Logo", "Silk-screen", "Carton number", "Serial number", 
    "CE Mark", "Size and shape of CE Mark", "Size and shape of WEEE Mark", 
    "Size and shape of Age Warning Mark", "Other"
  ];

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 10: F. MARKING & LABELING
      </h2>

      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          <thead>
            {/* F. MARKING & LABELING Title */}
            <tr>
              <th
                colSpan={5}
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
                F.&nbsp;&nbsp;MARKING & LABELING
              </th>
            </tr>
            {/* Barcode/Labeling/Printing */}
            <tr>
              <th colSpan={5} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Barcode/Labeling/Printing
              </th>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "40px" }}>No.</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Name</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Location</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Result</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", cursor: "pointer", width: "30px", fontSize: "16px" }} onClick={addBarcode}>+</th>
            </tr>
          </thead>
          <tbody>
            {barcodeItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select name={`barcode_name_${item.id}`} value={form[`barcode_name_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    {barcodeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <input type="text" name={`barcode_location_${item.id}`} value={form[`barcode_location_${item.id}`] || ""} onChange={handleChange} style={inputBase} />
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select name={`barcode_result_${item.id}`} value={form[`barcode_result_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <button
                    onClick={() => removeBarcode(item.id)}
                    disabled={barcodeItems.length === 1}
                    style={{ background: "transparent", color: barcodeItems.length === 1 ? colors.textMuted : colors.danger, border: "none", cursor: barcodeItems.length === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}

            {/* Instruction manual checks */}
            <tr>
              <td colSpan={5} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Instruction Manual
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>1</td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                Instruction manual and documentation check
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="instruction_provided_by" value={form.instruction_provided_by || ""} onChange={handleChange} placeholder="Provided By factory" style={{ ...inputBase, textAlign: "center" }} />
              </td>
            </tr>

            {/* Certificate Presentation */}
            <tr>
              <td colSpan={5} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Certificate Presentation
              </td>
            </tr>
            <tr>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "40px" }}>#</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Certificate</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Provided by</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Result</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", cursor: "pointer", width: "30px", fontSize: "16px" }} onClick={addCert}>+</th>
            </tr>
            {certItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select name={`cert_name_${item.id}`} value={form[`cert_name_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="Fillable">Fillable</option>
                    <option value="CE Certificate">CE Certificate</option>
                    <option value="RoHS">RoHS</option>
                    <option value="FCC">FCC</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select name={`cert_provided_${item.id}`} value={form[`cert_provided_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    <option value="Factory">Factory</option>
                    <option value="Client">Client</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                  <select name={`cert_result_${item.id}`} value={form[`cert_result_${item.id}`] || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}>
                  <button
                    onClick={() => removeCert(item.id)}
                    disabled={certItems.length === 1}
                    style={{ background: "transparent", color: certItems.length === 1 ? colors.textMuted : colors.danger, border: "none", cursor: certItems.length === 1 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}

            {/* Shipping Marks Header */}
            <tr>
              <td colSpan={5} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Shipping Marks
              </td>
            </tr>
            <tr>
              <th colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Name</th>
              <th style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Location</th>
              <th colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>Result</th>
            </tr>
            {/* Marks inputs */}
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center" }}>
                Shipping Marks
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="shipping_marks_location" value={form.shipping_marks_location || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  <option value="Front">Front</option>
                  <option value="Side">Side</option>
                  <option value="Top">Top</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="shipping_marks_result" value={form.shipping_marks_result || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                  <option value="N/A">N/A</option>
                </select>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center" }}>
                Side Marks
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="side_marks_location" value={form.side_marks_location || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  <option value="Front">Front</option>
                  <option value="Side">Side</option>
                  <option value="Top">Top</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="side_marks_result" value={form.side_marks_result || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                  <option value="N/A">N/A</option>
                </select>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center" }}>
                Inner Box Marks
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="inner_box_marks_location" value={form.inner_box_marks_location || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  <option value="Front">Front</option>
                  <option value="Side">Side</option>
                  <option value="Top">Top</option>
                </select>
              </td>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <select name="inner_box_marks_result" value={form.inner_box_marks_result || ""} onChange={handleChange} style={{ ...inputBase, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                  <option value="N/A">N/A</option>
                </select>
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
                  name="marking_result_final"
                  value={form.marking_result_final || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: markColor, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", outline: "none" }}
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
                  name="marking_remark"
                  value={form.marking_remark || "No shipping mark, only rated label"}
                  onChange={(e) => setField("marking_remark", e.target.value)}
                  context="marking and labeling inspection observations"
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

export default MarkingLabeling;

