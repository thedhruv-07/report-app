import React from "react";
import { colors, buttonStyle } from "../styles";

const MarkingLabeling = ({ form, handleChange, onPrev, onNext }) => {
  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 10: F. MARKING & LABELING
      </h2>

      {/* Barcode/Labeling/Printing and Instruction Manual Section */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td colSpan="3" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>
                Barcode/Labeling/Printing
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "33%" }}>Name</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "33%" }}>Location</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "33%" }}>Result</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, textAlign: "center", color: colors.textMuted, fontSize: "11px" }}>Unit</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="barcode_name" value={form.barcode_name || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="barcode_location" value={form.barcode_location || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="barcode_result" value={form.barcode_result || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>
                Instruction manual and documentation check
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="instruction_provided_by_label" value={form.instruction_provided_by_label || "Provided By factory"} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="instruction_provided_by" value={form.instruction_provided_by || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}>
                No instruction manual included
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="no_instruction_result" value={form.no_instruction_result || "N/A"} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}>
                No CDF was provided for comparison during inspection.
              </td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}></td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="no_cdf_result" value={form.no_cdf_result || "N/A"} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shipping Marks */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td colSpan="2" style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>
                Shipping Marks
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "50%" }}>Shipping Marks (on __ side)</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="shipping_marks" value={form.shipping_marks || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Side Marks (on __ side)</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="side_marks" value={form.side_marks || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Inner Box Marks (on __ side)</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="inner_box_marks" value={form.inner_box_marks || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Result and Remark */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold", width: "15%" }}>Result:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="marking_result_final" value={form.marking_result_final || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: "bold" }}>Remark:</td>
              <td style={{ padding: "8px", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <input type="text" name="marking_remark" value={form.marking_remark || ""} onChange={handleChange} style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxSizing: "border-box" }} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
        <button
          onClick={onPrev}
          style={{ ...buttonStyle }}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          style={{ ...buttonStyle }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MarkingLabeling;
