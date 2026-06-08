import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

// ── Shared card primitives ─────────────────────────────────────────────────

function CardHeader({ title }) {
  return (
    <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
      <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
    </div>
  );
}

const cardStyle = {
  background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`,
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: "16px",
};

function PillPicker({ name, value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map(({ label, color, bg, border }) => {
        const sel = value === label;
        return (
          <button key={label} type="button"
            onClick={() => onChange({ target: { name, value: label } })}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 10px 3px 6px", borderRadius: "20px", border: `1px solid ${sel ? border : colors.border}`, background: sel ? bg : "#fff", color: sel ? color : colors.textLight, cursor: "pointer", fontWeight: 600, fontSize: "11px", transition: "all 0.15s" }}
          >
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", border: `2px solid ${sel ? border : colors.border}`, background: sel ? border : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {sel && <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#fff" }} />}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Data constants ─────────────────────────────────────────────────────────

const INFORMATIVE_ACTIONS = ["sort", "rework", "replace", "re-inspect", "re-pack", "repair"];

const RISK_OPTS = [
  { label: "High",  color: colors.danger,   bg: "#fef2f2", border: colors.danger   },
  { label: "Low",   color: colors.success,  bg: "#f0fdf4", border: colors.success  },
  { label: "N/A",   color: colors.textMuted,bg: "#f8fafc", border: colors.textMuted},
];

const RISK_BLOCKS = [
  { key: "remarkQ1", text: "Leakage on roofs/walls (windows/doors)",                    detail: "Any visible water ingress points that could cause moisture damage to products." },
  { key: "remarkQ2", text: "Assigned person/department for mold control",               detail: "Factory has designated personnel responsible for monitoring mold prevention." },
  { key: "remarkQ3", text: "Mold control records maintained",                           detail: "Written logs or documentation for mold inspection and prevention activities." },
  { key: "remarkQ4", text: "Cartons on pallets (min. 12cm off floor, 1.5m from walls)", detail: "Proper pallet storage to prevent ground moisture and wall condensation." },
  { key: "remarkQ5", text: "QCs/supervisors verifying procedure daily",                 detail: "Daily quality control checks are performed and verified by supervisory staff." },
  { key: "remarkQ6", text: "Export cartons kept dry",                                   detail: "All cartons destined for export are stored in dry conditions free of moisture." },
  { key: "remarkQ7", text: "Damaged or wet cartons in use",                             detail: "Presence of compromised packaging materials being used in the production line." },
];

const COOPERATION_OPTS = [
  { value: "good",    label: "Good",    desc: "Enough manpower to assist and good cooperation.",                  color: colors.success,  bg: "#f0fdf4", border: colors.success  },
  { value: "average", label: "Average", desc: "Enough manpower to assist.",                                       color: colors.warning,  bg: "#fffbeb", border: colors.warning  },
  { value: "poor",    label: "Poor",    desc: "Manpower, equipment or documents not provided timely.",            color: colors.danger,   bg: "#fef2f2", border: colors.danger   },
];

const WORKER_OPTS = ["< 50", "50–100", "100–500", "500–1000", "> 1000"];

const OPINION_OPTS = [
  { value: "good",    label: "Good",    desc: "Factory was neat and tidy. Testing equipment well maintained and calibrated.", color: colors.success,  bg: "#f0fdf4", border: colors.success  },
  { value: "average", label: "Average", desc: "Factory was tidy. Testing equipment ran normally.",                           color: colors.warning,  bg: "#fffbeb", border: colors.warning  },
  { value: "poor",    label: "Poor",    desc: "Factory was messy. Basic testing equipment unavailable or non-working.",      color: colors.danger,   bg: "#fef2f2", border: colors.danger   },
];

const SAMPLE_DISPOSITIONS = [
  "collected and sent to head office",
  "sealed at the factory",
  "collected and forwarded to customers via head office",
  "collected and sent to customers at factory",
  "No sample was collected on site",
];

// ── Component ──────────────────────────────────────────────────────────────

export default function RemarksExtras({ form, onChange }) {
  const set = (name, value) => onChange({ target: { name, value } });

  return (
    <>
      {/* ── Card 1: Informative Remarks ── */}
      <div style={cardStyle}>
        <CardHeader title="Informative Remarks" />
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "13px", color: colors.text }}>
          <span>The factory was requested to</span>
          <select
            name="informativeAction"
            value={form.informativeAction || ""}
            onChange={onChange}
            style={{ fontSize: "13px", fontWeight: 700, color: colors.primary, border: "none", borderBottom: `2px solid ${colors.primary}`, outline: "none", background: "transparent", padding: "2px 4px", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option value="">select action…</option>
            {INFORMATIVE_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <span>the defective products our inspector found during the inspection.</span>
        </div>
      </div>

      {/* ── Card 2: Mold & Storage Risk Assessment ── */}
      <div style={cardStyle}>
        <CardHeader title="Mold & Storage Risk Assessment" />
        {RISK_BLOCKS.map((block, i) => (
          <div key={block.key}
            style={{ display: "flex", alignItems: "flex-start", padding: "10px 16px", borderBottom: i < RISK_BLOCKS.length - 1 ? "1px solid #edf0f5" : "none", gap: "16px" }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: colors.text, marginBottom: "2px" }}>{block.text}</div>
              <div style={{ fontSize: "11px", color: colors.textMuted }}>{block.detail}</div>
            </div>
            <div style={{ flexShrink: 0, paddingTop: "2px" }}>
              <PillPicker name={block.key} value={form[block.key]} onChange={onChange} options={RISK_OPTS} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Card 3: Factory Information ── */}
      <div style={cardStyle}>
        <CardHeader title="Factory Information" />

        {/* Factory cooperation */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #edf0f5" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textLight, marginBottom: "8px" }}>Factory Cooperation</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {COOPERATION_OPTS.map(opt => {
              const sel = form.factoryCooperation === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => set("factoryCooperation", opt.value)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${sel ? opt.border : colors.border}`, background: sel ? opt.bg : "#fff", cursor: "pointer", textAlign: "left", minWidth: "180px", flex: 1 }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: sel ? opt.color : colors.text, marginBottom: "2px" }}>{opt.label}</div>
                  <div style={{ fontSize: "11px", color: colors.textMuted }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Number of workers */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #edf0f5", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textLight, width: "160px", flexShrink: 0 }}>Workers in Factory</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {WORKER_OPTS.map(opt => {
              const sel = form.workerCount === opt;
              return (
                <button key={opt} type="button"
                  onClick={() => set("workerCount", opt)}
                  style={{ padding: "4px 12px", borderRadius: "20px", border: `1px solid ${sel ? colors.primary : colors.border}`, background: sel ? colors.primaryLight : "#fff", color: sel ? colors.primary : colors.textLight, cursor: "pointer", fontWeight: 600, fontSize: "11px" }}
                >{opt}</button>
              );
            })}
          </div>
        </div>

        {/* Inspector opinion */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #edf0f5" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textLight, marginBottom: "8px" }}>Inspector's Opinion on Factory</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {OPINION_OPTS.map(opt => {
              const sel = form.inspectorOpinion === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => set("inspectorOpinion", opt.value)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${sel ? opt.border : colors.border}`, background: sel ? opt.bg : "#fff", cursor: "pointer", textAlign: "left", minWidth: "180px", flex: 1 }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: sel ? opt.color : colors.text, marginBottom: "2px" }}>{opt.label}</div>
                  <div style={{ fontSize: "11px", color: colors.textMuted }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendation */}
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textLight, marginBottom: "6px" }}>Recommendations for Mass Production</div>
          <SmartTextarea
            name="recommendationText"
            value={form.recommendationText || ""}
            onChange={(e) => set("recommendationText", e.target.value)}
            placeholder="Write quality control recommendations for the manufacturer…"
            context="quality control recommendation for mass production improvement"
            minHeight={68}
            style={{ width: "100%", background: "transparent", color: colors.text, border: "none", borderBottom: "1px solid transparent", padding: "1px 4px", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit", resize: "none", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
            onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
          />
        </div>
      </div>

      {/* ── Card 4: Sample Collection Record ── */}
      <div style={cardStyle}>
        <CardHeader title="Sample Collection Record" />
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "13px", color: colors.text }}>
          <input
            type="number" min="0" name="sampleCountProduction"
            value={form.sampleCountProduction || ""}
            onChange={onChange}
            placeholder="0"
            style={{ width: "52px", fontSize: "13px", fontWeight: 700, color: colors.primary, textAlign: "center", border: "none", borderBottom: `2px solid ${colors.primary}`, outline: "none", background: "transparent", padding: "2px 4px", fontFamily: "inherit" }}
          />
          <span>production samples &</span>
          <input
            type="number" min="0" name="sampleCountDefective"
            value={form.sampleCountDefective || ""}
            onChange={onChange}
            placeholder="0"
            style={{ width: "52px", fontSize: "13px", fontWeight: 700, color: colors.primary, textAlign: "center", border: "none", borderBottom: `2px solid ${colors.primary}`, outline: "none", background: "transparent", padding: "2px 4px", fontFamily: "inherit" }}
          />
          <span>defective samples were</span>
          <select
            name="sampleDisposition"
            value={form.sampleDisposition || ""}
            onChange={onChange}
            style={{ fontSize: "13px", fontWeight: 700, color: colors.primary, border: "none", borderBottom: `2px solid ${colors.primary}`, outline: "none", background: "transparent", padding: "2px 4px", fontFamily: "inherit", cursor: "pointer" }}
          >
            <option value="">select…</option>
            {SAMPLE_DISPOSITIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span>.</span>
        </div>
      </div>
    </>
  );
}
