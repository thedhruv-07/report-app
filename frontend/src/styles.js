// Modern Color Palette
export const colors = {
  primary: "#3b82f6",      // Bright Blue
  primaryHover: "#2563eb", // Darker Blue
  primaryLight: "#dbeafe", // Very Light Blue
  
  success: "#10b981",      // Teal Green
  successHover: "#059669", // Darker Green
  
  danger: "#ef4444",       // Red
  dangerHover: "#dc2626",  // Darker Red
  
  warning: "#f59e0b",      // Amber
  warningHover: "#d97706", // Darker Amber
  
  background: "#f8fafc",   // Nearly White (Light Blue-Gray)
  surface: "#ffffff",      // Pure White
  surfaceAlt: "#f1f5f9",   // Very Light Gray
  
  text: "#1e293b",         // Dark Text
  textLight: "#64748b",    // Light Text
  textMuted: "#94a3b8",    // Muted Text
  
  border: "#e2e8f0",       // Light Border
  borderFocus: "#3b82f6",  // Blue Border on Focus
  
  header: "#1e293b",       // Dark Header Text
  headerBg: "#f0f9ff",     // Very Light Blue Background
};

// Input Styles
export const inputStyle = {
  width: "100%",
  padding: "6px 9px",
  marginBottom: "0",
  borderRadius: "6px",
  border: `1px solid ${colors.border}`,
  outline: "none",
  fontSize: "13px",
  fontFamily: "inherit",
  backgroundColor: "transparent",
  color: colors.text,
  transition: "border-color 0.2s ease",
  boxSizing: "border-box",
};

// Button Styles
export const buttonStyle = {
  flex: 1,
  padding: "12px 20px",
  background: colors.primary,
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
};

export const primaryButton = {
  padding: "12px 24px",
  background: colors.primary,
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
};

export const secondaryButton = {
  padding: "12px 24px",
  background: colors.surfaceAlt,
  color: colors.text,
  border: `2px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
};

export const removeButtonStyle = {
  width: "100%",
  padding: "12px 16px",
  background: colors.danger,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginBottom: "10px",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
};

export const addButtonStyle = {
  width: "100%",
  padding: "12px 16px",
  background: colors.success,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginBottom: "15px",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
};

export const itemBoxStyle = {
  marginBottom: "20px",
  padding: "20px",
  background: colors.surface,
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
};

export const tableHeaderStyle = {
  padding: "12px 14px",
  fontWeight: "600",
  background: colors.headerBg,
  border: `1px solid ${colors.border}`,
  color: colors.header,
  textAlign: "center",
  fontSize: "13px",
};

export const tableCellStyle = {
  padding: "12px 14px",
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  textAlign: "left",
  fontSize: "14px",
};

export const tableLabelStyle = {
  padding: "12px 14px",
  fontWeight: "600",
  background: colors.surfaceAlt,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  textAlign: "left",
  width: "35%",
  fontSize: "14px",
};

// Card Styling
export const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
};

export const sectionHeaderStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: colors.header,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "10px",
  marginTop: "0",
  paddingLeft: "10px",
  borderLeft: `3px solid ${colors.primary}`,
};

export const badgeStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "600",
};

export const successBadge = {
  ...badgeStyle,
  background: "rgba(16, 185, 129, 0.1)",
  color: colors.success,
};

export const errorBadge = {
  ...badgeStyle,
  background: "rgba(239, 68, 68, 0.1)",
  color: colors.danger,
};

export const warningBadge = {
  ...badgeStyle,
  background: "rgba(245, 158, 11, 0.1)",
  color: colors.warning,
};
