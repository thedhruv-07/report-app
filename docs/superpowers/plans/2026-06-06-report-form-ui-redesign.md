# Report Form UI Redesign — PSI / CLS / DPI / FA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact and modernise the layout of all 4 multi-step report forms (PSI, CLS, DPI, FA) — remove the large centered title/step indicator, move it into a breadcrumb in the tab bar, restyle tabs as compact pills with a progress bar, halve vertical space for form fields via 2-column CSS grid, import Outfit font, and reduce all padding so the General Information step fits on a 1280 px screen without scrolling.

**Architecture:** Each form file manages its own layout; there is no shared wrapper component. Changes fall into three layers: (1) global CSS / style constants, (2) the four top-level form files (PSIForm, CLSForm, DPIForm, FactoryAuditForm) for chrome/nav changes, and (3) the two field-rendering components (SchemaSection for schema-driven CLS/DPI/FA steps, SectionA_Summary for PSI step 1) for 2-column grid.

**Tech Stack:** React 19, Vite, inline styles (`styles.js` constants), `index.css` (Tailwind + custom), Google Fonts (Outfit).

**DO NOT TOUCH** any API calls, fetch/axios requests, form state (`useState`/`useReducer`), `onChange`/`onSubmit`/`onClick` handler functions, backend files, or route files. Variable names and prop names must stay identical.

---

## File Map

| File | Change |
|---|---|
| `frontend/src/index.css` | Add Outfit @import, update font-family |
| `frontend/src/styles.js` | Compact `sectionHeaderStyle`, compact `inputStyle` |
| `frontend/src/reports/PSI/PSIForm.jsx` | Nav breadcrumb + pills + progress bar; remove H1; compact buttons; reduce padding; update fontFamily |
| `frontend/src/reports/CLS/CLSForm.jsx` | Same as PSIForm |
| `frontend/src/reports/DPI/DPIForm.jsx` | Same as PSIForm |
| `frontend/src/reports/FactoryAudit/FactoryAuditForm.jsx` | Same as PSIForm (different existing nav structure) |
| `frontend/src/reports/shared/components/SchemaSection.jsx` | Replace `<table>` with 2-column CSS grid; compact section header |
| `frontend/src/reports/PSI/components/SectionA_Summary.jsx` | Replace `<table>` with 2-column CSS grid; compact section header |

---

## Task 1: Add Outfit Font + Update Global CSS

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Edit `frontend/src/index.css`**

  Replace the top of the file (before `@import "tailwindcss"`) and the `:root` block:

  ```css
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  @import "tailwindcss" layer(tailwind);

  /*
   * Disable Tailwind's preflight (CSS reset) so it doesn't
   * interfere with the existing PSI inline-style components.
   */
  @layer tailwind {
    @layer base {
      /* intentionally empty — blocks preflight from applying */
    }
  }

  :root {
    --primary: #3b82f6;
    --text: #1e293b;
    --text-muted: #94a3b8;
    --bg: #f8fafc;
    --surface: #ffffff;
    --border: #e2e8f0;

    font-family: 'Outfit', Arial, Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: var(--bg);
    font-family: 'Outfit', Arial, Helvetica, sans-serif;
  }
  ```

  Leave everything from `#root {` onwards unchanged.

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/src/index.css
  git commit -m "style: add Outfit font from Google Fonts as app-wide typeface"
  ```

---

## Task 2: Update Shared Style Constants

**Files:**
- Modify: `frontend/src/styles.js`

- [ ] **Step 1: Edit `sectionHeaderStyle` and `inputStyle` in `frontend/src/styles.js`**

  Replace the `inputStyle` export:

  ```js
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
  ```

  Replace the `sectionHeaderStyle` export:

  ```js
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/src/styles.js
  git commit -m "style: compact inputStyle and sectionHeaderStyle constants"
  ```

---

## Task 3: PSIForm.jsx — Nav + Chrome Redesign

**Files:**
- Modify: `frontend/src/reports/PSI/PSIForm.jsx`

The PSI form's render block starts at line 788. There are three zones to change:
1. The root `<div>` fontFamily
2. The top nav header (lines ~800–865)
3. The main content area header + action buttons (lines ~867–981)

- [ ] **Step 1: Update root div fontFamily**

  Find:
  ```jsx
  fontFamily: "Arial, Helvetica, sans-serif",
  ```
  (inside the root `<div style={{...}}>` at line ~789)

  Replace with:
  ```jsx
  fontFamily: "'Outfit', Arial, sans-serif",
  ```

- [ ] **Step 2: Replace the top nav header block**

  Find this entire block (from `{/* Top Navigation Header */}` to its closing `</div>`, approx lines 800–865):

  ```jsx
        {/* Top Navigation Header */}
        <div style={{
          width: "100%",
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "stretch",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          zIndex: 10,
          flexShrink: 0
        }}>
          {/* Brand Area Removed */}
          {/* Horizontal Navigation Area */}
          <div style={{ 
            flex: 1, 
            overflowX: "auto", 
            padding: "16px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            scrollbarWidth: "none", 
            background: colors.surface
          }}
          >
            {stepNavItems.map((item) => {
              const isActive = step === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goToStep(item.id)}
                  style={{
                    border: "none",
                    background: isActive ? colors.primaryLight : "transparent",
                    color: isActive ? colors.primary : colors.text,
                    borderRadius: "8px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isActive ? "700" : "500",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span style={{ 
                    width: "20px", 
                    height: "20px", 
                    borderRadius: "5px", 
                    background: isActive ? colors.primary : colors.surfaceAlt, 
                    color: isActive ? "#fff" : colors.textMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold"
                  }}>{item.id}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

        </div>
  ```

  Replace with:

  ```jsx
        {/* Top Navigation Header */}
        <div style={{
          width: "100%",
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          zIndex: 10,
          flexShrink: 0
        }}>
          {/* Breadcrumb + step indicator */}
          <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
              <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Pre-Shipment Inspection</span>
            </div>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of 13</span>
          </div>
          {/* Tab pills */}
          <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
            {stepNavItems.map((item) => {
              const isActive = step === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goToStep(item.id)}
                  style={{
                    border: "none",
                    background: isActive ? colors.primary : colors.surfaceAlt,
                    color: isActive ? "#fff" : colors.textMuted,
                    borderRadius: "20px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: isActive ? "700" : "500",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span style={{ 
                    width: "15px", height: "15px", borderRadius: "50%",
                    background: isActive ? "rgba(255,255,255,0.25)" : colors.border,
                    color: isActive ? "#fff" : colors.textMuted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: "bold", flexShrink: 0
                  }}>{item.id}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
          {/* Progress bar */}
          <div style={{ height: "3px", background: colors.border }}>
            <div style={{ width: `${(step / 13) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
          </div>
        </div>
  ```

- [ ] **Step 3: Remove large H1 / step subtitle / progress bar from content area, and compact the action buttons**

  Find this block in the main content area (the `{/* Header */}` div plus the `{/* Clear Form Button */}` div, approx lines 883–981):

  ```jsx
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? "20px" : "40px" }}>
            <h1 style={{ 
              fontSize: isMobile ? "20px" : "clamp(24px, 2.4vw, 30px)", 
              fontWeight: "800", 
              color: colors.header,
              margin: "0 0 10px 0"
            }}>
              Pre-Shipment Inspection Report
            </h1>
            <p style={{ 
              fontSize: "13px", 
              color: colors.textMuted,
              margin: "0"
            }}>
              Step {step} of 13
            </p>
            <div style={{
              display: "flex",
              height: "4px",
              background: colors.border,
              borderRadius: "2px",
              marginTop: "12px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${(step / 13) * 100}%`,
                background: colors.primary,
                transition: "width 0.3s ease"
              }}></div>
            </div>
          </div>

          {/* Clear Form Button */}
          <div style={{ 
            display: "flex", 
            justifyContent: isMobile ? "center" : "flex-end", 
            gap: "10px", 
            marginBottom: isMobile ? "20px" : "30px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={quickFillForm}
              style={{
                padding: isMobile ? "8px 14px" : "10px 18px",
                background: colors.success,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: isMobile ? "11px" : "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)"
              }}
            >
              ⚡ Quick Fill Template
            </button>
            <button
              onClick={handleSaveDraft}
              style={{
                padding: isMobile ? "8px 14px" : "10px 18px",
                background: colors.warning,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: isMobile ? "11px" : "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.warningHover;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = colors.warning;
              }}
            >
              💾 Save Draft
            </button>
            <button
              onClick={clearForm}
              style={{
                padding: isMobile ? "8px 14px" : "10px 18px",
                background: colors.danger,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: isMobile ? "11px" : "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)"
              }}
            >
              ⟲ Clear Form & Restart
            </button>
          </div>
  ```

  Replace with (just the compact action buttons — the entire H1 header block is removed):

  ```jsx
          {/* Compact action buttons */}
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            gap: "8px", 
            marginBottom: "12px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={quickFillForm}
              style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}
            >
              ⚡ Quick Fill
            </button>
            <button
              onClick={handleSaveDraft}
              style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}
              onMouseEnter={(e) => { e.target.style.background = colors.warningHover; }}
              onMouseLeave={(e) => { e.target.style.background = colors.warning; }}
            >
              💾 Save Draft
            </button>
            <button
              onClick={clearForm}
              style={{ padding: "7px 12px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(239,68,68,0.15)" }}
            >
              ⟲ Clear
            </button>
          </div>
  ```

- [ ] **Step 4: Reduce content area padding**

  Find the outer scrollable content div:
  ```jsx
        <div style={{
          flex: 1,
          overflowY: "auto",
          background: colors.surface,
          scrollBehavior: "smooth"
        }}>

          <div style={{
            width: "100%",
            margin: "0",
            background: colors.surface,
            padding: isMobile ? "20px 16px" : "40px",
            minHeight: "fit-content"
          }}>
  ```

  Replace with:
  ```jsx
        <div style={{
          flex: 1,
          overflowY: "auto",
          background: "#f8fafc",
          scrollBehavior: "smooth"
        }}>

          <div style={{
            width: "100%",
            margin: "0",
            background: "#f8fafc",
            padding: isMobile ? "10px 12px" : "14px 22px",
            minHeight: "fit-content"
          }}>
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/reports/PSI/PSIForm.jsx
  git commit -m "style: PSIForm compact nav bar with breadcrumb, pill tabs, and progress bar"
  ```

---

## Task 4: CLSForm.jsx — Nav + Chrome Redesign

**Files:**
- Modify: `frontend/src/reports/CLS/CLSForm.jsx`

Same three-zone change as Task 3.

- [ ] **Step 1: Update root div fontFamily**

  Find:
  ```jsx
  <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", overflow: "hidden", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
  ```
  Replace `fontFamily: "Arial, Helvetica, sans-serif"` with `fontFamily: "'Outfit', Arial, sans-serif"`.

- [ ] **Step 2: Replace the top nav block**

  Find (approx lines 334–343):
  ```jsx
      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, display: "flex", flexDirection: isMobile ? "column" : "row", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, overflowX: "auto", padding: "16px", display: "flex", gap: "8px", alignItems: "center", scrollbarWidth: "none", background: colors.surface }}>
          {steps.map((item) => (
            <button key={item.id} onClick={() => setStep(item.id)} style={{ border: "none", background: step === item.id ? colors.primaryLight : "transparent", color: step === item.id ? colors.primary : colors.text, borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontSize: "13px", fontWeight: step === item.id ? "700" : "500", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: step === item.id ? colors.primary : colors.surfaceAlt, color: step === item.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>{item.id}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
  ```

  Replace with:
  ```jsx
      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.surface, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Container Loading Supervision</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
        </div>
        <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
          {steps.map((item) => (
            <button key={item.id} onClick={() => setStep(item.id)} style={{ border: "none", background: step === item.id ? colors.primary : colors.surfaceAlt, color: step === item.id ? "#fff" : colors.textMuted, borderRadius: "20px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", fontWeight: step === item.id ? "700" : "500", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
              <span style={{ width: "15px", height: "15px", borderRadius: "50%", background: step === item.id ? "rgba(255,255,255,0.25)" : colors.border, color: step === item.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold", flexShrink: 0 }}>{item.id}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ height: "3px", background: colors.border }}>
          <div style={{ width: `${(step / steps.length) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>
  ```

- [ ] **Step 3: Remove H1 / progress bar from content, compact action buttons**

  Find (approx lines 346–368):
  ```jsx
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: "800", color: colors.header, margin: "0 0 10px 0" }}>Container Loading Supervision</h1>
          <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0" }}>Step {step} of {steps.length}</p>
          <div style={{ display: "flex", height: "4px", background: colors.border, borderRadius: "2px", marginTop: "12px", overflow: "hidden" }}>
            <div style={{ width: `${(step / steps.length) * 100}%`, background: colors.primary, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
          <button onClick={autofillDemoData} style={{ padding: "10px 18px", background: colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)" }}>
            ⚡ Autofill Demo Data
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "10px 18px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)" }}>
            💾 Save Draft
          </button>
          <button onClick={clearForm} style={{ padding: "10px 18px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)" }}>
            ⟲ Clear Form
          </button>
        </div>
  ```

  Replace with:
  ```jsx
        {/* Compact action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <button onClick={autofillDemoData} style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}>
            ⚡ Quick Fill
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>
            💾 Save Draft
          </button>
          <button onClick={clearForm} style={{ padding: "7px 12px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(239,68,68,0.15)" }}>
            ⟲ Clear
          </button>
        </div>
  ```

- [ ] **Step 4: Reduce content area padding**

  Find:
  ```jsx
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", background: colors.surface, padding: isMobile ? "20px 16px" : "40px" }}>
  ```
  Replace with:
  ```jsx
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: isMobile ? "10px 12px" : "14px 22px" }}>
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/reports/CLS/CLSForm.jsx
  git commit -m "style: CLSForm compact nav bar with breadcrumb, pill tabs, and progress bar"
  ```

---

## Task 5: DPIForm.jsx — Nav + Chrome Redesign

**Files:**
- Modify: `frontend/src/reports/DPI/DPIForm.jsx`

Same pattern as Tasks 3 and 4. DPI has 15 steps (id 1–15) and uses `totalSteps` variable.

- [ ] **Step 1: Update root div fontFamily**

  Find:
  ```jsx
  <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", overflow: "hidden", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
  ```
  Replace `fontFamily: "Arial, Helvetica, sans-serif"` with `fontFamily: "'Outfit', Arial, sans-serif"`.

- [ ] **Step 2: Replace top nav block**

  Find (approx lines 316–326):
  ```jsx
      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, display: "flex", flexDirection: isMobile ? "column" : "row", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, overflowX: "auto", padding: "16px", display: "flex", gap: "8px", alignItems: "center", scrollbarWidth: "none", background: colors.surface }}>
          {steps.map((item) => (
            <button key={item.id} onClick={() => setStep(item.id)} style={{ border: "none", background: step === item.id ? colors.primaryLight : "transparent", color: step === item.id ? colors.primary : colors.text, borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontSize: "13px", fontWeight: step === item.id ? "700" : "500", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: step === item.id ? colors.primary : colors.surfaceAlt, color: step === item.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>{item.id}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
  ```

  Replace with:
  ```jsx
      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.surface, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>During Production Inspection</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {totalSteps}</span>
        </div>
        <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
          {steps.map((item) => (
            <button key={item.id} onClick={() => setStep(item.id)} style={{ border: "none", background: step === item.id ? colors.primary : colors.surfaceAlt, color: step === item.id ? "#fff" : colors.textMuted, borderRadius: "20px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", fontWeight: step === item.id ? "700" : "500", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
              <span style={{ width: "15px", height: "15px", borderRadius: "50%", background: step === item.id ? "rgba(255,255,255,0.25)" : colors.border, color: step === item.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold", flexShrink: 0 }}>{item.id}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ height: "3px", background: colors.border }}>
          <div style={{ width: `${(step / totalSteps) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>
  ```

- [ ] **Step 3: Remove H1 block, compact action buttons**

  Find (approx lines 331–351):
  ```jsx
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: "800", color: colors.header, margin: "0 0 10px 0" }}>During Production Inspection</h1>
          <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0" }}>Step {step} of {totalSteps}</p>
          <div style={{ display: "flex", height: "4px", background: colors.border, borderRadius: "2px", marginTop: "12px", overflow: "hidden" }}>
            <div style={{ width: `${(step / totalSteps) * 100}%`, background: colors.primary, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
          <button onClick={fillDemoData} style={{ padding: "10px 18px", background: colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)" }}>
            ✨ Fill Demo Data
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "10px 18px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)" }}>
            💾 Save Draft
          </button>
          <button onClick={clearForm} style={{ padding: "10px 18px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)" }}>
            ⟲ Clear Form
          </button>
        </div>
  ```

  Replace with:
  ```jsx
        {/* Compact action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <button onClick={fillDemoData} style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}>
            ✨ Quick Fill
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>
            💾 Save Draft
          </button>
          <button onClick={clearForm} style={{ padding: "7px 12px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(239,68,68,0.15)" }}>
            ⟲ Clear
          </button>
        </div>
  ```

- [ ] **Step 4: Reduce content area padding**

  Find:
  ```jsx
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", background: colors.surface, padding: isMobile ? "20px 16px" : "40px" }}>
  ```
  Replace with:
  ```jsx
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: isMobile ? "10px 12px" : "14px 22px" }}>
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/reports/DPI/DPIForm.jsx
  git commit -m "style: DPIForm compact nav bar with breadcrumb, pill tabs, and progress bar"
  ```

---

## Task 6: FactoryAuditForm.jsx — Nav + Chrome Redesign

**Files:**
- Modify: `frontend/src/reports/FactoryAudit/FactoryAuditForm.jsx`

The FA form's nav structure is different — it's a single flat div without a wrapper. Also uses `setStep(s => ...)` lambdas instead of `prev()`/`next()` functions, but navigation buttons are untouched.

- [ ] **Step 1: Update root div fontFamily**

  Find:
  ```jsx
  <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
  ```
  Replace `fontFamily: "Arial, Helvetica, sans-serif"` with `fontFamily: "'Outfit', Arial, sans-serif"`.

- [ ] **Step 2: Replace the tab bar div**

  Find (approx lines 731–748):
  ```jsx
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: "10px", display: "flex", overflowX: "auto", gap: "8px", scrollbarWidth: "none" }}>
        {steps.map(s => (
          <button 
            key={s.id} 
            onClick={() => setStep(s.id)} 
            style={{ 
              border: "none", 
              background: step === s.id ? colors.primaryLight : "transparent", 
              color: step === s.id ? colors.primary : colors.text, 
              borderRadius: "6px", padding: "8px 12px", whiteSpace: "nowrap", 
              cursor: "pointer", fontWeight: step === s.id ? "700" : "500", fontSize: "13px",
              transition: "all 0.2s"
            }}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>
  ```

  Replace with:
  ```jsx
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Factory Audit</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
        </div>
        <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
          {steps.map(s => (
            <button 
              key={s.id} 
              onClick={() => setStep(s.id)} 
              style={{ border: "none", background: step === s.id ? colors.primary : colors.surfaceAlt, color: step === s.id ? "#fff" : colors.textMuted, borderRadius: "20px", padding: "4px 10px", whiteSpace: "nowrap", cursor: "pointer", fontWeight: step === s.id ? "700" : "500", fontSize: "11px", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <span style={{ width: "15px", height: "15px", borderRadius: "50%", background: step === s.id ? "rgba(255,255,255,0.25)" : colors.border, color: step === s.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold", flexShrink: 0 }}>{s.id}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ height: "3px", background: colors.border }}>
          <div style={{ width: `${(step / steps.length) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>
  ```

- [ ] **Step 3: Remove H1 block and compact action buttons**

  Find (approx lines 750–767):
  ```jsx
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 15px" : "40px" }}>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: isMobile ? "24px" : "36px", fontWeight: "900", color: colors.header, marginBottom: "10px", letterSpacing: "-0.5px" }}>Factory Audit Module</h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <span style={{ padding: "4px 12px", background: colors.primaryLight, color: colors.primary, borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>STEP {step} OF {steps.length}</span>
              <span style={{ color: colors.textMuted, fontSize: "14px", fontWeight: "500" }}>{currentStep?.label}</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: colors.border, borderRadius: "2px", marginTop: "20px", overflow: "hidden" }}>
              <div style={{ width: `${(step / steps.length) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}></div>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", gap: "12px", marginBottom: "30px", flexWrap: "wrap" }}>
            <button onClick={autofillDemoData} style={{ padding: "10px 20px", background: colors.primary, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)", transition: "all 0.2s" }}>⚡ Autofill Demo Data</button>
            <button onClick={handleSaveDraft} style={{ padding: "10px 20px", background: colors.warning, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)", transition: "all 0.2s" }}>💾 Save Draft</button>
            <button onClick={clearForm} style={{ padding: "10px 20px", background: colors.danger, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)", transition: "all 0.2s" }}>⟲ Clear</button>
          </div>
  ```

  Replace with:
  ```jsx
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: isMobile ? "10px 12px" : "14px 22px" }}>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          {/* Compact action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <button onClick={autofillDemoData} style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}>⚡ Quick Fill</button>
            <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>💾 Save Draft</button>
            <button onClick={clearForm} style={{ padding: "7px 12px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(239,68,68,0.15)" }}>⟲ Clear</button>
          </div>
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/reports/FactoryAudit/FactoryAuditForm.jsx
  git commit -m "style: FactoryAuditForm compact nav bar with breadcrumb, pill tabs, and progress bar"
  ```

---

## Task 7: SchemaSection.jsx — 2-Column CSS Grid

**Files:**
- Modify: `frontend/src/reports/shared/components/SchemaSection.jsx`

This component drives all CLS, DPI, and FA steps. Currently renders each field as a `<table>` row (`<tr>`/`<td>`). Replace with a 2-column CSS grid where each field is a card. Wide fields (textarea, photo, radio) span both columns.

- [ ] **Step 1: Rewrite `SchemaSection.jsx` completely**

  The complete new file (all imports and exports are identical, only the rendering changes):

  ```jsx
  import { colors } from '../../../styles';
  import SmartTextarea from '../../../components/shared/SmartTextarea';
  import { compressImage } from '../../../utils/imageCompression';
  import { UploadCloud } from "lucide-react";

  const FIELD_CARD = {
    background: "#fff",
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "8px 12px",
  };

  const FIELD_LABEL = {
    display: "block",
    fontSize: "10px",
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "5px",
  };

  const INPUT_BASE = {
    width: "100%",
    background: "transparent",
    color: colors.text,
    border: `1px solid ${colors.border}`,
    padding: "5px 7px",
    borderRadius: "5px",
    boxSizing: "border-box",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
  };

  export default function SchemaSection({ title, fields, formData, onChange, ai = true }) {
    return (
      <div style={{ marginBottom: "18px" }}>
        <h3 style={{
          fontSize: "11px", fontWeight: "700", color: colors.header,
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: "10px", marginTop: "0",
          paddingLeft: "10px", borderLeft: `3px solid ${colors.primary}`,
        }}>
          {title}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {Array.isArray(fields) && fields.map((field) => {
            const isWide = field.type === "textarea" || field.type === "photo" || field.type === "radio";
            return (
              <div key={field.name} style={{ ...FIELD_CARD, gridColumn: isWide ? "1 / -1" : undefined }}>
                <label style={FIELD_LABEL}>{field.label}</label>

                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    style={{ ...INPUT_BASE }}
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>

                ) : field.type === "photo" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {formData[field.name] ? (
                      <div style={{ position: "relative", width: "160px" }}>
                        <img
                          src={formData[field.name]}
                          alt="Preview"
                          style={{ width: "160px", height: "120px", objectFit: "contain", borderRadius: "6px", border: `1px solid ${colors.border}`, background: "#f8f9fa" }}
                        />
                        <button
                          type="button"
                          onClick={() => onChange({ target: { name: field.name, value: "" } })}
                          style={{ position: "absolute", top: "-7px", right: "-7px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}
                        >×</button>
                      </div>
                    ) : (
                      <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", background: colors.primaryLight, color: colors.primary, cursor: "pointer", fontSize: "12px", fontWeight: "600", border: `1px dashed ${colors.primary}`, width: "fit-content" }}>
                        <UploadCloud size={14} />
                        Upload Document
                        <input
                          type="file" accept="image/*" style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                const { preview } = await compressImage(file);
                                onChange({ target: { name: field.name, value: preview } });
                              } catch { alert("Failed to process image"); }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                ) : (field.type === "text" || field.type === "textarea" || !field.type) ? (
                  ai ? (
                    <SmartTextarea
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={onChange}
                      placeholder={field.placeholder || ""}
                      context={field.label}
                      minHeight={field.type === "textarea" ? 70 : 30}
                      style={{ width: "100%", background: "transparent", color: colors.text, border: `1px solid ${colors.border}`, padding: "5px 7px", borderRadius: "5px", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit", resize: "none" }}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={onChange}
                      placeholder={field.placeholder || ""}
                      style={{ ...INPUT_BASE, minHeight: "70px", resize: "vertical" }}
                    />
                  ) : (
                    <input type="text" name={field.name} placeholder={field.placeholder || ""} value={formData[field.name] || ""} onChange={onChange} style={{ ...INPUT_BASE }} />
                  )

                ) : field.type === "radio" ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                    {field.options.map(opt => {
                      const isSelected = formData[field.name] === opt;
                      const isYesNo = field.options.includes("Yes") && field.options.includes("No");
                      const isYes = opt === "Yes";
                      const isNo = opt === "No";
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => onChange({ target: { name: field.name, value: opt } })}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            padding: "4px 10px", borderRadius: "6px",
                            border: `1px solid ${isSelected ? (isYesNo ? (isYes ? colors.success : colors.danger) : colors.primary) : colors.border}`,
                            background: isSelected ? (isYesNo ? (isYes ? "#f0fdf4" : "#fef2f2") : colors.primaryLight) : colors.surface,
                            color: isSelected ? (isYesNo ? (isYes ? colors.success : colors.danger) : colors.primary) : colors.text,
                            cursor: "pointer", fontWeight: "600", fontSize: "12px",
                          }}
                        >
                          {isYes && <span>✓</span>}
                          {isNo && <span>✕</span>}
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                ) : (
                  <input type={field.type} name={field.name} placeholder={field.placeholder || ""} value={formData[field.name] || ""} onChange={onChange} style={{ ...INPUT_BASE }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/src/reports/shared/components/SchemaSection.jsx
  git commit -m "style: SchemaSection 2-column CSS grid replaces table layout"
  ```

---

## Task 8: PSI SectionA_Summary.jsx — 2-Column CSS Grid

**Files:**
- Modify: `frontend/src/reports/PSI/components/SectionA_Summary.jsx`

The PSI GeneralInfo step has 10 fields rendered as a `<table>` on the left, with a photo panel on the right. Replace the table with a 2-column CSS grid. Leave photo panel unchanged (right side stays as-is).

- [ ] **Step 1: Replace the `<table>` and `<h3>` inside the left `<div style={{ flex: 1 }}>` block**

  Find (lines 84–166, the h3 + table):
  ```jsx
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "20px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>I. GENERAL INFORMATION</h3>
        
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}` }}>
          <tbody>
            <tr>
              <td style={{ ...tableLabelStyle }}>Service Performed:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="servicePerformed" placeholder="Pre-Shipment Inspection"
                  value={form.servicePerformed || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Client:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="client" placeholder="FRIN"
                  value={form.client || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Supplier:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="supplier" placeholder="JUFENG"
                  value={form.supplier || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Factory:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="factory" placeholder="JUFENG"
                  value={form.factory || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Product Name:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="productName" placeholder="Nut Forming Machine & Moulds"
                  value={form.productName || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>P.O. No.:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="po" placeholder="8092023"
                  value={form.po || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Item No.:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="itemNo" placeholder="30B nut forming machine (Model: 30B-6S-40), Mould M8, Mould M10, Mould M12, Mould M14"
                  value={form.itemNo || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Destination Country:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="country" placeholder="India"
                  value={form.country || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Inspection Date:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="inspectionDate" placeholder="20240516"
                  value={form.inspectionDate || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Inspection Location:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="inspectionLocation" placeholder="Jiangsu (CHINA)"
                  value={form.inspectionLocation || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Reference Sample:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="referenceSample" placeholder="Yes/No"
                  value={form.referenceSample || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
          </tbody>
        </table>
  ```

  Replace with:
  ```jsx
        <h3 style={{
          fontSize: "11px", fontWeight: "700", color: colors.header,
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: "10px", marginTop: "0",
          paddingLeft: "10px", borderLeft: `3px solid ${colors.primary}`,
        }}>I. General Information</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Service Performed</label>
            <input name="servicePerformed" placeholder="Pre-Shipment Inspection" value={form.servicePerformed || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Client</label>
            <input name="client" placeholder="FRIN" value={form.client || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Supplier</label>
            <input name="supplier" placeholder="JUFENG" value={form.supplier || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Factory</label>
            <input name="factory" placeholder="JUFENG" value={form.factory || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Product Name</label>
            <input name="productName" placeholder="Nut Forming Machine & Moulds" value={form.productName || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>P.O. No.</label>
            <input name="po" placeholder="8092023" value={form.po || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Item No.</label>
            <input name="itemNo" placeholder="30B nut forming machine (Model: 30B-6S-40), Mould M8, Mould M10, Mould M12, Mould M14" value={form.itemNo || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Destination Country</label>
            <input name="country" placeholder="India" value={form.country || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Inspection Date</label>
            <input name="inspectionDate" placeholder="20240516" value={form.inspectionDate || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Inspection Location</label>
            <input name="inspectionLocation" placeholder="Jiangsu (CHINA)" value={form.inspectionLocation || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Reference Sample</label>
            <input name="referenceSample" placeholder="Yes/No" value={form.referenceSample || ""} onChange={handleChange} style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "5px", padding: "5px 7px", fontSize: "13px", color: colors.text, background: "transparent", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

        </div>
  ```

  Also remove the unused `tableLabelStyle` import from the import line at the top of the file:
  ```jsx
  // Before:
  import { buttonStyle, colors, tableLabelStyle } from '../../../styles';
  // After:
  import { buttonStyle, colors } from '../../../styles';
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/src/reports/PSI/components/SectionA_Summary.jsx
  git commit -m "style: PSI GeneralInfo step 2-column CSS grid replaces table layout"
  ```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Remove large H1 + step subtitle from content area | Tasks 3–6 Step 3 |
| Move report title to navbar as breadcrumb | Tasks 3–6 Step 2 |
| Progress bar below tab row | Tasks 3–6 Step 2 |
| Compact pill tabs (smaller font, border-radius 20px) | Tasks 3–6 Step 2 |
| Active tab filled accent blue | Tasks 3–6 Step 2 |
| Inactive tabs light gray with number badge | Tasks 3–6 Step 2 |
| Compact action buttons row top-right | Tasks 3–6 Step 3 |
| 2-column grid for form fields | Tasks 7–8 |
| Label above input (small/muted/uppercase) | Tasks 7–8 |
| Section header: left accent border, small caps | Tasks 7–8 |
| Reduce padding ~30% | Tasks 3–6 Step 4 |
| Outfit font import + apply | Tasks 1 + Steps 1 in 3–6 |
| Apply to PSI, CLS, DPI, FA | Tasks 3–6 |
| Do not touch handlers/state/API | Not touched anywhere |

**Type consistency check:** All field names (`servicePerformed`, `client`, `supplier`, etc.) in Task 8 match those already in the form state and `handleChange`. No renames.

**Placeholder scan:** No TBD/TODO placeholders in any step. All code blocks are complete.

**Note on remaining steps:** Tasks 7–8 cover Step 1 (General Information) for all 4 form types. All later steps in CLS/DPI/FA also use `SchemaSection`, so they automatically inherit the 2-column grid from Task 7. PSI's later steps (2–12) have their own custom components with table layouts; updating them follows the same grid pattern as Task 8 and can be done in follow-up tasks if needed.
