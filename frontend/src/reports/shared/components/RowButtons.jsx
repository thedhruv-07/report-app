import { Plus, X } from "lucide-react";
import { colors } from "../../../styles";

export function AddRowButton({ onClick, label = "Add Row" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        border: "none",
        borderRadius: "6px",
        background: colors.primary,
        color: "#fff",
        fontSize: "12px",
        fontWeight: 600,
        padding: "6px 14px",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <Plus size={13} />
      {label}
    </button>
  );
}

export function RemoveRowButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        color: disabled ? colors.textMuted : colors.danger,
        padding: "2px 4px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
      }}
    >
      <X size={14} />
    </button>
  );
}

export function AddIconButton({ onClick, size = 18 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: colors.primary,
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        width: `${size}px`,
        height: `${size}px`,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Plus size={size - 6} />
    </button>
  );
}
