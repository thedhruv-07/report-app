import { inputStyle, buttonStyle } from "../styles";

export default function GeneralInfo({ form, handleChange, onNext }) {
  return (
    <>
      <h3>General Information</h3>

      <input name="servicePerformed" placeholder="Service Performed"
        onChange={handleChange} style={inputStyle} />

      <input name="client" placeholder="Client"
        onChange={handleChange} style={inputStyle} />

      <input name="supplier" placeholder="Supplier"
        onChange={handleChange} style={inputStyle} />

      <input name="factory" placeholder="Factory"
        onChange={handleChange} style={inputStyle} />

      <input name="productName" placeholder="Product Name"
        onChange={handleChange} style={inputStyle} />

      <input name="po" placeholder="P.O Number" 
        onChange={handleChange} style={inputStyle} />

      <input name="itemNo" placeholder="Item No" 
        onChange={handleChange} style={inputStyle} />

      <input name="country" placeholder="Destination Country" 
        onChange={handleChange} style={inputStyle} />

      <input name="inspectionDate" placeholder="Inspection Date (YYYYMMDD)"
        onChange={handleChange} style={inputStyle} />

      <input name="inspectionLocation" placeholder="Inspection Location"
        onChange={handleChange} style={inputStyle} />

      <input name="referenceSample" placeholder="Reference Sample (Yes/No)"
        onChange={handleChange} style={inputStyle} />

      <button onClick={onNext} style={buttonStyle}>Next</button>
    </>
  );
}
