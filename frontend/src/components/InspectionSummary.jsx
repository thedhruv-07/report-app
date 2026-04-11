import { inputStyle, buttonStyle } from "../styles";

export default function InspectionSummary({ handleChange, onPrev, onNext }) {
  return (
    <>
      <h3>Inspection Summary</h3>
      
      <input name="result" placeholder="Result (Pass/Fail)"
        onChange={handleChange} style={inputStyle} />
      
      <input name="quantityResult" placeholder="Quantity Result" 
        onChange={handleChange} style={inputStyle} />
      
      <input name="workmanshipResult" placeholder="Workmanship Result" 
        onChange={handleChange} style={inputStyle} />
      
      <input name="packingResult" placeholder="Packing Result" 
        onChange={handleChange} style={inputStyle} />

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
