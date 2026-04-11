import { inputStyle, buttonStyle } from "../styles";

export default function FinalDetails({ form, handleChange, onFileChange, onPrev, onSubmit }) {
  return (
    <>
      <h3>Final Details</h3>

      <input name="inspector" placeholder="Inspector Name"
        onChange={handleChange} style={inputStyle} />

      <input type="file" multiple
        onChange={onFileChange}
        style={{ marginBottom: "15px" }}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onSubmit} style={buttonStyle}>Generate Report</button>
      </div>
    </>
  );
}
