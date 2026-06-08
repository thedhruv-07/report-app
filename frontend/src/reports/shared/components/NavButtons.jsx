import { colors } from '../../../styles';

const btn = (isPrimary) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 24px",
  borderRadius: "24px",
  border: "none",
  background: isPrimary ? colors.primary : colors.primary,
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.15s, transform 0.1s",
  boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
});

export default function NavButtons({ onPrev, onNext, prevLabel = "Back", nextLabel = "Next", hideBack = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
      {!hideBack && (
        <button
          type="button"
          onClick={onPrev}
          style={btn(false)}
          onMouseEnter={e => { e.currentTarget.style.background = colors.primaryHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = colors.primary;      e.currentTarget.style.transform = "translateY(0)"; }}
        >
          ← {prevLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        style={btn(true)}
        onMouseEnter={e => { e.currentTarget.style.background = colors.primaryHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = colors.primary;      e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {nextLabel} →
      </button>
    </div>
  );
}
