import React from "react";
import { colors, buttonStyle } from "../styles";

const MarkingLabeling = ({ form, handleChange, onPrev, onNext }) => {
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

  const markColor = getResultColor(form.marking_result_final);

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
                colSpan={3}
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
            {/* Barcode/Labeling/Printing sub-header */}
            <tr>
              <th colSpan={3} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Barcode/Labeling/Printing <span style={{ color: colors.textMuted, fontWeight: "normal", fontSize: "11px", marginLeft: "10px" }}>请双击选择</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Columns */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "50%" }}>
                Name
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "25%" }}>Location</td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "center", width: "25%" }}>Result</td>
            </tr>
            {/* Data */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="barcode_name" value={form.barcode_name || ""} onChange={handleChange} placeholder="Rating label" style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="barcode_location" value={form.barcode_location || ""} onChange={handleChange} placeholder="Unit" style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="barcode_result" value={form.barcode_result || ""} onChange={handleChange} placeholder="Pass" style={{ ...inputBase, textAlign: "center" }} />
              </td>
            </tr>

            {/* Instruction manual checks */}
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                Instruction manual and documentation check
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="instruction_provided_by_label" value={form.instruction_provided_by_label || "Provided By factory"} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="instruction_provided_by" value={form.instruction_provided_by || ""} onChange={handleChange} placeholder="Pass" style={{ ...inputBase, textAlign: "center" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                No instruction manual included
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="no_instruction_result" value={form.no_instruction_result || "N/A"} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                No CDF was provided for comparison during inspection.
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder, textAlign: "center" }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="no_cdf_result" value={form.no_cdf_result || "N/A"} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} />
              </td>
            </tr>

            {/* Shipping Marks Header */}
            <tr>
              <td colSpan={3} style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, fontWeight: "bold" }}>
                Shipping Marks
              </td>
            </tr>
            {/* Marks inputs */}
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                Shipping Marks (on _ side)
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="shipping_marks" value={form.shipping_marks || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                Side Marks (on _ side)
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="side_marks" value={form.side_marks || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text }}>
                Inner Box Marks (on _ side)
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input type="text" name="inner_box_marks" value={form.inner_box_marks || ""} onChange={handleChange} style={{ ...inputBase, textAlign: "center" }} placeholder="-" />
              </td>
            </tr>

            {/* Result & Remark */}
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, fontWeight: "bold", textAlign: "left" }}>
                Result:
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="marking_result_final"
                  value={form.marking_result_final || ""}
                  onChange={handleChange}
                  placeholder="Pending"
                  style={{ ...inputBase, textAlign: "center", color: markColor, fontWeight: "bold" }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: "8px", background: colors.surface, border: cellBorder, color: colors.text, textAlign: "left" }}>
                Remark:
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: cellBorder }}>
                <input
                  type="text"
                  name="marking_remark"
                  value={form.marking_remark || "No shipping mark, only rated label"}
                  onChange={handleChange}
                  style={{ ...inputBase, textAlign: "center" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

export default MarkingLabeling;
