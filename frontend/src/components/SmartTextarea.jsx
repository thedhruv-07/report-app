import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { colors } from "../styles";

export default function SmartTextarea({ 
  value, 
  onChange, 
  context = "report writing", 
  placeholder,
  minHeight = 52,
  ...props 
}) {
  const [suggestion, setSuggestion] = useState("");
  const [manualHeight, setManualHeight] = useState(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef({ dragging: false, startY: 0, startH: 0 });

  // ─── Auto-grow: runs synchronously after every DOM update ─────────────────
  useLayoutEffect(() => {
    if (manualHeight !== null) return;
    const el = textareaRef.current;
    if (!el) return;
    // Setting to "1px" forces the browser to expose the true scrollHeight
    el.style.height = "1px";
    const next = Math.max(minHeight, el.scrollHeight);
    el.style.height = next + "px";
  }, [value, manualHeight, minHeight]);

  // Apply manual height
  useLayoutEffect(() => {
    if (manualHeight === null) return;
    const el = textareaRef.current;
    if (el) el.style.height = manualHeight + "px";
  }, [manualHeight]);

  // ─── Drag-to-resize handle ─────────────────────────────────────────────────
  const onDragStart = (e) => {
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    dragRef.current = {
      dragging: true,
      startY: e.clientY,
      startH: el.getBoundingClientRect().height,
    };

    const onMove = (ev) => {
      if (!dragRef.current.dragging) return;
      const delta = ev.clientY - dragRef.current.startY;
      const next = Math.max(minHeight, dragRef.current.startH + delta);
      setManualHeight(next);
    };

    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Double-click handle → reset to auto-grow
  const onDragDblClick = () => setManualHeight(null);

  // ─── AI suggestion debounce ────────────────────────────────────────────────
  useEffect(() => {
    setSuggestion("");
    if (!value || value.trim() === "" || /[.\n]$/.test(value)) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, partialText: value }),
        });
        const data = await res.json();
        if (data.suggestion) setSuggestion(data.suggestion);
      } catch {
        // fail silently
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value, context]);

  // ─── Tab / Right Arrow to accept suggestion ────────────────────────────────
  const handleKeyDown = (e) => {
    const isAtEnd = e.target.selectionStart === value.length;
    if ((e.key === "Tab" || (e.key === "ArrowRight" && isAtEnd)) && suggestion) {
      e.preventDefault();
      e.stopPropagation();
      acceptSuggestion();
    }
    if (props.onKeyDown) props.onKeyDown(e);
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
    // cursor to end on next tick
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newValue.length, newValue.length);
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Suggestion preview strip */}
      {suggestion && (
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            fontStyle: "italic",
            padding: "2px 2px 4px",
            lineHeight: "1.4",
            borderLeft: `2px solid ${colors.primary}`,
            paddingLeft: "6px",
            marginBottom: "3px",
            maxHeight: "60px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {suggestion}
        </div>
      )}

      {/* The real textarea — height is controlled by useLayoutEffect */}
      <textarea
        ref={textareaRef}
        {...props}
        value={value}
        onChange={(e) => {
          setSuggestion("");
          onChange(e);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          ...(props.style || {}),
          width: "100%",
          minHeight: minHeight + "px",
          boxSizing: "border-box",
          display: "block",
          overflow: "hidden",  // hides scrollbar while height adjusts
          resize: "none",       // we provide our own handle
          transition: "height 0.1s ease",
        }}
      />

      {/* Bottom bar: Accept button + drag handle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "16px",
          marginTop: "1px",
        }}
      >
        {/* Accept Suggestion button */}
        {suggestion ? (
          <button
            type="button"
            onClick={acceptSuggestion}
            style={{
              background: colors.primary,
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "2px 10px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              letterSpacing: "0.3px",
            }}
          >
            ✓ Accept Suggestion  (Tab)
          </button>
        ) : (
          <div />
        )}

        {/* Drag-to-resize grip */}
        <div
          onMouseDown={onDragStart}
          onDoubleClick={onDragDblClick}
          title="Drag to resize · Double-click to auto-fit"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            cursor: "ns-resize",
            userSelect: "none",
            padding: "2px 6px",
            borderRadius: "3px",
            opacity: 0.5,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "3px",
                height: "3px",
                borderRadius: "50%",
                background: colors.textMuted,
              }}
            />
          ))}
          <span style={{ fontSize: "9px", color: colors.textMuted, marginLeft: "2px" }}>
            drag
          </span>
        </div>
      </div>
    </div>
  );
}
