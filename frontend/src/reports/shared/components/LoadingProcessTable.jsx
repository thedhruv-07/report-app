import React from "react";
import { colors } from '../../../styles';
import SchemaPhotos from "./SchemaPhotos";

export default function LoadingProcessTable({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ target: { name: field, value } });
  };

  const borderColor = "#1F1F1F";
  const cellBorder = `1px solid ${borderColor}`;
  const sectionHeaderBg = "#E8E8E8";
  const subHeaderBg = "#E9ECEF";
  const headerColor = "#1F4E79";

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    border: cellBorder,
    fontSize: "12px",
    marginBottom: "20px"
  };

  const headerCellStyle = {
    padding: "10px 12px",
    background: sectionHeaderBg,
    border: cellBorder,
    fontWeight: "bold",
    color: headerColor,
    textAlign: "left",
    fontSize: "14px"
  };

  const subHeaderCellStyle = {
    padding: "8px",
    background: subHeaderBg,
    border: cellBorder,
    fontWeight: "bold",
    color: colors.text
  };

  const labelCellStyle = {
    padding: "8px",
    background: subHeaderBg,
    border: cellBorder,
    fontWeight: "bold",
    color: colors.text,
    width: "180px"
  };

  const cellStyle = {
    padding: "0",
    border: cellBorder,
    background: colors.surface
  };

  const inputStyle = {
    width: "100%",
    border: "none",
    outline: "none",
    padding: "6px 8px",
    fontSize: "12px",
    background: "transparent",
    boxSizing: "border-box",
    color: colors.text,
    fontFamily: "inherit"
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      {/* Section Header */}
      <table style={{ ...tableStyle, marginBottom: 0 }}>
        <thead>
          <tr>
            <th colSpan="6" style={headerCellStyle}>D.&nbsp;&nbsp;LOADING PROCESS</th>
          </tr>
        </thead>
      </table>

      {/* Container Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th colSpan="6" style={subHeaderCellStyle}>Container:</th>
            </tr>
            <tr>
              <th style={{ ...cellStyle, padding: "8px", width: "15%", background: subHeaderBg, fontWeight: "bold", color: colors.text }}>Container Type</th>
              <th style={{ ...cellStyle, padding: "8px", width: "15%", background: subHeaderBg, fontWeight: "bold", color: colors.text }}>Container No.</th>
              <th style={{ ...cellStyle, padding: "8px", width: "15%", background: subHeaderBg, fontWeight: "bold", color: colors.text }}>Seal No.</th>
              <th style={{ ...cellStyle, padding: "8px", width: "15%", background: subHeaderBg, fontWeight: "bold", color: colors.text }}>Seal No. (AV) / If used</th>
              <th style={{ ...cellStyle, padding: "8px", width: "30%", background: subHeaderBg, fontWeight: "bold", color: colors.text }}>Item No. (Loaded Cargo)</th>
              <th style={{ ...cellStyle, padding: "8px", width: "10%", background: subHeaderBg, fontWeight: "bold", color: colors.text }}>Loaded Carton</th>
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
            <th colSpan="2" style={subHeaderCellStyle}>Loading Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Loading Location:</td>
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
            <td style={labelCellStyle}>Weather:</td>
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
            <td style={labelCellStyle}>Sheltered:</td>
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
            <td style={labelCellStyle}>Start Time:</td>
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
            <td style={labelCellStyle}>End Time:</td>
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
      <div style={{ ...subHeaderCellStyle, border: `1px solid ${borderColor}`, marginBottom: "4px" }}>Photos:</div>
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
