import React, { useState } from "react";
import { colors, inputStyle } from "../../styles";

export default function AuthInput({ label, type = "text", value, onChange, placeholder, required = false, error }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: "20px" }}>
      {label && (
        <label style={{ 
          display: "block", 
          fontSize: "13px", 
          fontWeight: "600", 
          color: colors.text,
          marginBottom: "8px" 
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            ...inputStyle,
            marginBottom: "0",
            border: error ? `2px solid ${colors.danger}` : `2px solid ${colors.border}`,
            fontSize: "15px",
            paddingRight: isPassword ? "45px" : "12px"
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: colors.primary,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "700",
              padding: "4px",
              userSelect: "none"
            }}
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: colors.danger, fontSize: "12px", marginTop: "4px", marginHeight: "0" }}>
          {error}
        </p>
      )}
    </div>
  );
}
