import { inputStyle, buttonStyle } from "../styles";

export default function Remarks({ handleChange, onPrev, onNext }) {
  return (
    <>
      <h3>Remarks</h3>

      <textarea name="remarks" placeholder="Enter remarks"
        onChange={handleChange} style={{ ...inputStyle, height: "80px" }} />

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
