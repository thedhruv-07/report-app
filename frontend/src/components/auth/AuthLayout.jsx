import React from "react";
import { colors } from "../../styles";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: colors.background,
      padding: "20px",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "450px",
        background: colors.surface,
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        padding: "40px",
        border: `1px solid ${colors.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ 
            fontSize: "24px", 
            fontWeight: "800", 
            color: colors.primary, 
            letterSpacing: "-0.02em",
            marginBottom: "8px"
          }}>
            VERITAS REPORT
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: colors.header, margin: "0 0 8px" }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: "14px", color: colors.textMuted, margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
