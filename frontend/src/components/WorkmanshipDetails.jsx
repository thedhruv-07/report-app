import { inputStyle, buttonStyle } from "../styles";

export default function WorkmanshipDetails({ handleChange, onPrev, onNext }) {
  return (
    <>
      <h3>Workmanship Details</h3>
      
      <input name="critical" placeholder="Critical Issues"
        onChange={handleChange} style={inputStyle} />
      
      <input name="major" placeholder="Major Issues"
        onChange={handleChange} style={inputStyle} />
      
      <input name="minor" placeholder="Minor Issues"
        onChange={handleChange} style={inputStyle} />

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
