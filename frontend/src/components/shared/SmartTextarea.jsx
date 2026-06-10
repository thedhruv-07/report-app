import { useState, useLayoutEffect, useRef } from "react";
import { colors } from '../../styles';
import { ENDPOINTS } from '../../config/api';
import { useReportMeta } from '../../context/ReportMetaContext';

export default function SmartTextarea({
  value,
  onChange,
  context = "report writing",
  placeholder,
  minHeight = 52,
  photos = [],
  ...props
}) {
  const reportMeta = useReportMeta();
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualHeight, setManualHeight] = useState(null);
  const textareaRef = useRef(null);
  const dragRef = useRef({ dragging: false, startY: 0, startH: 0 });

  // ─── Auto-grow ─────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (manualHeight !== null) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "1px";
    el.style.height = Math.max(minHeight, el.scrollHeight) + "px";
  }, [value, manualHeight, minHeight]);

  useLayoutEffect(() => {
    if (manualHeight === null) return;
    const el = textareaRef.current;
    if (el) el.style.height = manualHeight + "px";
  }, [manualHeight]);

  // ─── Drag-to-resize ────────────────────────────────────────────────────────
  const onDragStart = (e) => {
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    dragRef.current = { dragging: true, startY: e.clientY, startH: el.getBoundingClientRect().height };
    const onMove = (ev) => {
      if (!dragRef.current.dragging) return;
      setManualHeight(Math.max(minHeight, dragRef.current.startH + ev.clientY - dragRef.current.startY));
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ─── Manual AI suggestion (button-only) ────────────────────────────────────
  const fetchSuggestion = async () => {
    setLoading(true);
    setSuggestion("");
    try {
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("reportToken");
      const res = await fetch(ENDPOINTS.SUGGEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ context, partialText: value || "", photos, reportMeta }),
      });
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = () => {
    const newValue = value + suggestion;
    onChange({
      target: { name: props.name || "remark", value: newValue, type: "textarea" },
      persist: () => {},
      preventDefault: () => {},
      stopPropagation: () => {},
    });
    setSuggestion("");
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newValue.length, newValue.length);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // ─── Tab / Right Arrow accepts suggestion ──────────────────────────────────
  const handleKeyDown = (e) => {
    const isAtEnd = e.target.selectionStart === (value || "").length;
    if ((e.key === "Tab" || (e.key === "ArrowRight" && isAtEnd)) && suggestion) {
      e.preventDefault();
      e.stopPropagation();
      acceptSuggestion();
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Suggestion preview strip */}
      {suggestion && (
        <div style={{
          fontSize: "11px", color: "#9ca3af", fontStyle: "italic",
          padding: "2px 6px 4px", lineHeight: "1.4",
          borderLeft: `2px solid ${colors.primary}`, marginBottom: "3px",
          maxHeight: "60px", overflow: "hidden",
        }}>
          {suggestion}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        {...props}
        value={value}
        onChange={(e) => { setSuggestion(""); onChange(e); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          ...(props.style || {}),
          width: "100%",
          minHeight: minHeight + "px",
          boxSizing: "border-box",
          display: "block",
          overflow: "hidden",
          resize: "none",
          transition: "height 0.1s ease",
        }}
      />

      {/* Bottom bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "18px", marginTop: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {loading ? (
            <span style={{ fontSize: "10px", color: colors.textMuted, fontStyle: "italic" }}>✨ Thinking...</span>
          ) : suggestion ? (
            <>
              <button type="button" onClick={acceptSuggestion} style={{ background: colors.primary, color: "#fff", border: "none", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", padding: "2px 10px", cursor: "pointer" }}>
                ✓ Accept (Tab)
              </button>
              <button type="button" onClick={() => setSuggestion("")} style={{ background: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: "4px", fontSize: "11px", fontWeight: "bold", padding: "1px 6px", cursor: "pointer", lineHeight: 1 }}>
                ✕
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={fetchSuggestion}
              style={{ background: "transparent", color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: "4px", fontSize: "10px", fontWeight: "bold", padding: "1px 8px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.primary; }}
            >
              ✨ AI Suggest
            </button>
          )}
        </div>

        {/* Drag-to-resize grip */}
        <div
          onMouseDown={onDragStart}
          onDoubleClick={() => setManualHeight(null)}
          title="Drag to resize · Double-click to auto-fit"
          style={{ display: "flex", alignItems: "center", gap: "3px", cursor: "ns-resize", userSelect: "none", padding: "2px 6px", borderRadius: "3px", opacity: 0.5, transition: "opacity 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: colors.textMuted }} />
          ))}
          <span style={{ fontSize: "9px", color: colors.textMuted, marginLeft: "2px" }}>drag</span>
        </div>
      </div>
    </div>
  );
}
