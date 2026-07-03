import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import { Lock } from 'lucide-react';

const LABEL_W = "180px";

const cardStyle = {
  background: "#fff",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  overflow: "hidden",
  marginBottom: "16px",
};

function CardHeader({ title }) {
  return (
    <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
      <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
    </div>
  );
}

function Row({ label, children, isLast, alignTop }) {
  return (
    <div
      style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", padding: alignTop ? "10px 16px" : "8px 16px", borderBottom: isLast ? "none" : "1px solid #edf0f5", transition: "background 0.15s" }}
      onMouseEnter={(e) => { if (!alignTop) e.currentTarget.style.background = "#fafbfc"; }}
      onMouseLeave={(e) => { if (!alignTop) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ width: LABEL_W, flexShrink: 0, fontSize: "12px", color: colors.textLight, fontWeight: 600, paddingTop: alignTop ? "3px" : 0 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function TextInput({ name, value, onChange, placeholder }) {
  return (
    <input
      type="text"
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      style={{ flex: 1, border: "none", borderBottom: "1px solid transparent", outline: "none", fontSize: "13px", color: colors.text, background: "transparent", padding: "1px 4px", fontFamily: "inherit", transition: "border-color 0.2s", width: "100%" }}
      onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
      onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
    />
  );
}

function StatusPicker({ name, value, onChange }) {
  const opts = [
    { label: "Passed",  border: colors.success },
    { label: "Failed",  border: colors.danger },
    { label: "Pending", border: colors.warning },
    { label: "N/A",     border: colors.textMuted },
  ];
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {opts.map(({ label, border }) => {
        const sel = value === label;
        return (
          <div key={label} style={{ width: "60px", display: "flex", justifyContent: "center" }}>
            <button type="button"
              onClick={() => onChange({ target: { name, value: label } })}
              style={{ padding: "4px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${sel ? border : colors.border}`, background: sel ? border : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {sel && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

const CRITERIA_ROWS = [
  { key: "quantity",      label: "A. Quantity"                   },
  { key: "workmanship",   label: "B. Workmanship"                },
  { key: "onSiteTests",   label: "C. On-Site Tests"              },
  { key: "dimensions",    label: "D. Dimensions"                 },
  { key: "packing",       label: "E. Packing"                    },
  { key: "markingLabeling", label: "F. Marking & Labeling"       },
  { key: "clientSpecial", label: "G. Client Special Requirement" },
];

const RESULT_COLOR = { Passed: colors.success, Failed: colors.danger, Pending: colors.warning };

function LockedValue({ value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '1px 4px' }}>
      <span style={{ fontSize: '13px', color: colors.text, fontWeight: 600 }}>{value || '—'}</span>
      <Lock size={11} color="#7c3aed" title={`${label} set by CS — not editable`} />
    </div>
  );
}

export default function InspectionSummaryTable({ form, handleChange, onPrev, onNext, lockedAql = false, lockedOrderQty = false, lockedAvailableQty = false }) {
  const setField = (name, value) => handleChange({ target: { name, value } });

  return (
    <div>

      {/* ── Card 1: Inspection Criteria ── */}
      <div style={cardStyle}>
        <CardHeader title="II. Inspection Criteria" />
        
        {/* Column sub-header */}
        <div style={{ display: "flex", alignItems: "center", padding: "6px 16px", background: "#f8fafc", borderBottom: "1px solid #edf0f5" }}>
          <div style={{ width: LABEL_W, flexShrink: 0 }}></div>
          <div style={{ flex: 1, display: "flex", gap: "8px" }}>
            <div style={{ width: "60px", textAlign: "center", fontSize: "11px", color: colors.textMuted, fontWeight: 600 }}>Passed</div>
            <div style={{ width: "60px", textAlign: "center", fontSize: "11px", color: colors.textMuted, fontWeight: 600 }}>Failed</div>
            <div style={{ width: "60px", textAlign: "center", fontSize: "11px", color: colors.textMuted, fontWeight: 600 }}>Pending</div>
            <div style={{ width: "60px", textAlign: "center", fontSize: "11px", color: colors.textMuted, fontWeight: 600 }}>N/A</div>
          </div>
        </div>
        {CRITERIA_ROWS.map((row, i) => (
          <Row key={row.key} label={row.label} isLast={i === CRITERIA_ROWS.length - 1}>
            <StatusPicker name={row.key} value={form[row.key]} onChange={handleChange} />
          </Row>
        ))}
      </div>

      {/* ── Card 2: Workmanship Summary ── */}
      <div style={cardStyle}>
        <CardHeader title="Workmanship Summary (based on finished products)" />

        {/* Column sub-header */}
        <div style={{ display: "grid", gridTemplateColumns: `${LABEL_W} 240px 90px 90px 90px`, gap: 0, padding: "6px 16px", background: "#f8fafc", borderBottom: "1px solid #edf0f5" }}>
          <div />
          <div style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 600 }}>Value</div>
          <div style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 600, textAlign: "center" }}>Critical</div>
          <div style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 600, textAlign: "center" }}>Major</div>
          <div style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 600, textAlign: "center" }}>Minor</div>
        </div>

        {/* Rows with 3 extra columns */}
        {[
          { label: "Inspection Standard", name: "inspectionStandard", c: "aqlCriticalWM",      m: "aqlMajorWM",      mi: "aqlMinorWM",      aql: true },
          { label: "Sampling Plan",        name: "samplingPlan",                                                                      aql: true },
          { label: "Inspection Level",     name: "inspectionLevel",    c: "acceptedCritical", m: "acceptedMajor", mi: "acceptedMinor", aql: true },
          { label: "Order Quantity",       name: "orderQuantity",      c: "foundCritical",    m: "foundMajor",    mi: "foundMinor",    oqty: true },
        ].map((row) => (
          <div key={row.name}
            style={{ display: "grid", gridTemplateColumns: `${LABEL_W} 240px 90px 90px 90px`, gap: 0, padding: "7px 16px", borderBottom: "1px solid #edf0f5", alignItems: "center", transition: "background 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fafbfc"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ fontSize: "12px", color: colors.textLight, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {row.label}
              {row.aql && lockedAql && <Lock size={10} color="#7c3aed" title="Set by CS" />}
              {row.oqty && lockedOrderQty && <Lock size={10} color="#7c3aed" title="Set by CS" />}
            </div>
            <div style={{ paddingRight: "8px" }}>
              {(row.aql && lockedAql) || (row.oqty && lockedOrderQty)
                ? <LockedValue value={form[row.name]} label={row.label} />
                : <TextInput name={row.name} value={form[row.name]} onChange={handleChange} placeholder="—" />
              }
            </div>
            <div style={{ paddingRight: "4px" }}>
              {row.c && row.aql && lockedAql
                ? <LockedValue value={form[row.c]} label={`${row.label} Critical`} />
                : <TextInput name={row.c} value={form[row.c]} onChange={handleChange} placeholder="—" />
              }
            </div>
            <div style={{ paddingRight: "4px" }}>
              {row.m && row.aql && lockedAql
                ? <LockedValue value={form[row.m]} label={`${row.label} Major`} />
                : <TextInput name={row.m} value={form[row.m]} onChange={handleChange} placeholder="—" />
              }
            </div>
            <div>
              {row.mi && row.aql && lockedAql
                ? <LockedValue value={form[row.mi]} label={`${row.label} Minor`} />
                : <TextInput name={row.mi} value={form[row.mi]} onChange={handleChange} placeholder="—" />
              }
            </div>
          </div>
        ))}

        {/* Simple rows */}
        <Row label={
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Available Quantity {lockedAvailableQty && <Lock size={10} color="#7c3aed" title="Set by CS" />}
          </span>
        }>
          {lockedAvailableQty
            ? <LockedValue value={form.availableQuantity} label="Available Quantity" />
            : <TextInput name="availableQuantity" value={form.availableQuantity} onChange={handleChange} placeholder="Enter quantity" />
          }
        </Row>
        <Row label={
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Sample Size {lockedAql && <Lock size={10} color="#7c3aed" title="Set by CS" />}
          </span>
        }>
          {lockedAql
            ? <LockedValue value={form.sampleSize} label="Sample Size" />
            : <TextInput name="sampleSize" value={form.sampleSize} onChange={handleChange} placeholder="Enter size" />
          }
        </Row>

        {/* Result */}
        <Row label="Overall Result" isLast>
          <select
            name="overallResult"
            value={form.overallResult || ""}
            onChange={handleChange}
            style={{ border: "none", borderBottom: "1px solid transparent", outline: "none", fontSize: "13px", fontWeight: 700, color: RESULT_COLOR[form.overallResult] || colors.textMuted, background: "transparent", padding: "1px 4px", fontFamily: "inherit", cursor: "pointer", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
            onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
          >
            <option value="">Select result…</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </Row>
      </div>

      {/* ── Card 3: Signatures & Comments ── */}
      <div style={cardStyle}>
        <CardHeader title="Signatures & Comments" />
        <Row label="Inspector Signature">
          <TextInput name="inspectorSignature" value={form.inspectorSignature} onChange={handleChange} placeholder="Inspector name and signature details" />
        </Row>
        <Row label="Factory Comments" alignTop isLast={false}>
          <textarea
            name="factoryComments"
            value={form.factoryComments || ""}
            onChange={(e) => setField("factoryComments", e.target.value)}
            placeholder="Factory representative comments after inspection"
            style={{ width: "100%", minHeight: "68px", background: "transparent", color: colors.text, border: "none", borderBottom: "1px solid #e2e8f0", padding: "1px 4px", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit", resize: "vertical", outline: "none" }}
          />
        </Row>
        <Row label="Factory Notes (Chinese)" alignTop isLast>
          <textarea
            name="factoryNotesChinese"
            value={form.factoryNotesChinese || ""}
            onChange={(e) => setField("factoryNotesChinese", e.target.value)}
            placeholder="输入中文备注…"
            style={{ width: "100%", minHeight: "68px", background: "transparent", color: colors.text, border: "none", borderBottom: "1px solid #e2e8f0", padding: "1px 4px", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit", resize: "vertical", outline: "none" }}
          />
        </Row>
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />

    </div>
  );
}
