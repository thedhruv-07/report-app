import React from "react";
import SchemaPhotos from "./SchemaPhotos";

export default function LoadingProcessTable({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ target: { name: field, value } });
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #999",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "12px",
    marginBottom: "20px"
  };

  const headerStyle = {
    background: "#f1f1f1",
    padding: "6px 8px",
    border: "1px solid #999",
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#333"
  };

  const labelStyle = {
    background: "#f9f9f9",
    padding: "6px 8px",
    border: "1px solid #999",
    fontWeight: "bold",
    width: "180px"
  };

  const cellStyle = {
    padding: "0",
    border: "1px solid #999",
    background: "#fff"
  };

  const inputStyle = {
    width: "100%",
    border: "none",
    outline: "none",
    padding: "6px 8px",
    fontSize: "12px",
    background: "transparent",
    boxSizing: "border-box"
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      {/* Section Header */}
      <div style={headerStyle}>D. LOADING PROCESS</div>

      {/* Container Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th colSpan="6" style={{ ...labelStyle, width: "100%", textAlign: "left", background: "#f1f1f1" }}>Container:</th>
            </tr>
            <tr style={{ background: "#f9f9f9" }}>
              <th style={{ ...cellStyle, padding: "6px 8px", width: "15%" }}>Container Type</th>
              <th style={{ ...cellStyle, padding: "6px 8px", width: "15%" }}>Container No.</th>
              <th style={{ ...cellStyle, padding: "6px 8px", width: "15%" }}>Seal No.</th>
              <th style={{ ...cellStyle, padding: "6px 8px", width: "15%" }}>Seal No. (AV) / If used</th>
              <th style={{ ...cellStyle, padding: "6px 8px", width: "30%" }}>Item No. (Loaded Cargo)</th>
              <th style={{ ...cellStyle, padding: "6px 8px", width: "10%" }}>Loaded Carton</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>
                <input 
                  type="text" 
                  value={formData.containerType || ""} 
                  onChange={(e) => handleChange("containerType", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={cellStyle}>
                <input 
                  type="text" 
                  value={formData.containerNo || ""} 
                  onChange={(e) => handleChange("containerNo", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={cellStyle}>
                <input 
                  type="text" 
                  value={formData.sealNo || ""} 
                  onChange={(e) => handleChange("sealNo", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={cellStyle}>
                <input 
                  type="text" 
                  value={formData.avSealNo || ""} 
                  onChange={(e) => handleChange("avSealNo", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={cellStyle}>
                <textarea 
                  rows="2"
                  value={formData.cargoBreakdown || ""} 
                  onChange={(e) => handleChange("cargoBreakdown", e.target.value)}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "34px" }}
                />
              </td>
              <td style={cellStyle}>
                <input 
                  type="text" 
                  value={formData.loadedCarton || ""} 
                  onChange={(e) => handleChange("loadedCarton", e.target.value)}
                  style={inputStyle}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Loading Condition Table */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan="2" style={{ ...labelStyle, width: "100%", textAlign: "left", background: "#f1f1f1" }}>Loading Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={labelStyle}>Loading Location:</td>
            <td style={cellStyle}>
              <input 
                type="text" 
                value={formData.location || ""} 
                onChange={(e) => handleChange("location", e.target.value)}
                style={inputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Weather:</td>
            <td style={cellStyle}>
              <input 
                type="text" 
                value={formData.weather || ""} 
                onChange={(e) => handleChange("weather", e.target.value)}
                style={inputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Sheltered:</td>
            <td style={cellStyle}>
              <input 
                type="text" 
                value={formData.shelter || ""} 
                onChange={(e) => handleChange("shelter", e.target.value)}
                style={inputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>Start Time:</td>
            <td style={cellStyle}>
              <input 
                type="text" 
                value={formData.loadingStartTime || ""} 
                onChange={(e) => handleChange("loadingStartTime", e.target.value)}
                style={inputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>End Time:</td>
            <td style={cellStyle}>
              <input 
                type="text" 
                value={formData.loadingEndTime || ""} 
                onChange={(e) => handleChange("loadingEndTime", e.target.value)}
                style={inputStyle}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Photos Row */}
      <div style={{ ...headerStyle, borderTop: "none" }}>Photos:</div>
      <div style={{ border: "1px solid #999", padding: "10px", background: "#fff" }}>
        <SchemaPhotos 
          config={{ groups: [
            { id: "loadingAreaPhotos", label: "Loading Area Photos" },
            { id: "warehousePhotos", label: "Warehouse Photos" }
          ] }} 
          formData={formData} 
          onChange={onChange} 
        />
      </div>
    </div>
  );
}
