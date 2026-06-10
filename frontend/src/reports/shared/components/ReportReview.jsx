import { useState } from 'react';
import NavButtons from './NavButtons';
import Lightbox from '../../../components/shared/Lightbox';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const NAVY = '#1F4E79';
const BORDER = '#1F1F1F';
const SUB_HDR = '#E9ECEF';

function resultBadge(val = '') {
  const v = String(val).toUpperCase();
  if (v === 'PASSED' || v === 'PASS')   return { color: '#166534', bg: '#dcfce7', border: '#16a34a' };
  if (v === 'FAILED' || v === 'FAIL')   return { color: '#991b1b', bg: '#fee2e2', border: '#dc2626' };
  if (v === 'PENDING')                  return { color: '#92400e', bg: '#fef3c7', border: '#d97706' };
  if (v === 'N/A')                      return { color: '#374151', bg: '#f3f4f6', border: '#9ca3af' };
  return null;
}

const RESULT_VALUES = new Set(['PASSED', 'PASS', 'FAILED', 'FAIL', 'PENDING', 'N/A']);

function CellValue({ value }) {
  if (value === undefined || value === null || value === '') {
    return <span style={{ color: '#9ca3af' }}>—</span>;
  }
  const v = String(value).toUpperCase();
  const rb = resultBadge(value);
  if (rb && RESULT_VALUES.has(v)) {
    return (
      <span style={{
        display: 'inline-block', padding: '1px 10px',
        borderRadius: 3, border: `1px solid ${rb.border}`,
        background: rb.bg, color: rb.color,
        fontWeight: 700, fontSize: 11,
      }}>
        {value}
      </span>
    );
  }
  return <span>{value}</span>;
}

// ── Section header row (dark navy) ──────────────────────────────────────────
function SectionHeader({ roman, title, stepIndex, onEdit }) {
  return (
    <tr>
      <td
        colSpan={2}
        style={{
          padding: '7px 12px',
          background: NAVY,
          color: '#fff',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          border: `1px solid ${BORDER}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{roman}. {title}</span>
          {onEdit && stepIndex != null && (
            <button
              onClick={() => onEdit(stepIndex)}
              style={{
                padding: '2px 10px', borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 10, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── A plain label/value row ───────────────────────────────────────────────────
function DataRow({ label, value, rowIdx }) {
  const bg = rowIdx % 2 === 0 ? '#fff' : '#fafbff';
  return (
    <tr style={{ background: bg }}>
      <td style={{ padding: '5px 12px', fontWeight: 600, fontSize: 12, color: '#374151', border: `1px solid ${BORDER}`, verticalAlign: 'top', width: '35%' }}>
        {label}
      </td>
      <td style={{ padding: '5px 12px', fontSize: 12, color: '#1e293b', border: `1px solid ${BORDER}`, verticalAlign: 'top', wordBreak: 'break-word' }}>
        <CellValue value={value} />
      </td>
    </tr>
  );
}

// ── Generic fields section ────────────────────────────────────────────────────
function FieldRows({ fields }) {
  const visible = (fields || []).filter(f => f.value !== undefined && f.value !== null && f.value !== '');
  if (!visible.length) {
    return (
      <tr>
        <td colSpan={2} style={{ padding: '8px 12px', fontSize: 12, color: '#9ca3af', border: `1px solid ${BORDER}`, fontStyle: 'italic' }}>
          No data entered.
        </td>
      </tr>
    );
  }
  return visible.map((f, i) => <DataRow key={i} label={f.label} value={f.value} rowIdx={i} />);
}

// ── Quantity items section ────────────────────────────────────────────────────
function ItemRows({ items = [], fields = [] }) {
  const valid = items.filter(it => it.itemName || it.name || it.po);
  const thStyle = { padding: '5px 10px', background: SUB_HDR, fontWeight: 700, fontSize: 11, color: NAVY, border: `1px solid ${BORDER}`, textAlign: 'center' };
  const tdStyle = (i) => ({ padding: '5px 10px', fontSize: 12, color: '#1e293b', border: `1px solid ${BORDER}`, background: i % 2 === 0 ? '#fff' : '#fafbff', textAlign: 'center' });

  return (
    <>
      {valid.length > 0 && (
        <tr>
          <td colSpan={2} style={{ padding: 0, border: `1px solid ${BORDER}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 30 }}>#</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Item Description</th>
                  <th style={thStyle}>P.O. No.</th>
                  <th style={thStyle}>Order Qty</th>
                  <th style={thStyle}>Packed Qty</th>
                </tr>
              </thead>
              <tbody>
                {valid.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                    <td style={{ ...tdStyle(i) }}>{i + 1}</td>
                    <td style={{ ...tdStyle(i), textAlign: 'left', padding: '5px 10px' }}>{it.itemName || it.name || '—'}</td>
                    <td style={tdStyle(i)}>{it.po || '—'}</td>
                    <td style={tdStyle(i)}>{it.orderQty || '—'}</td>
                    <td style={tdStyle(i)}>{it.sampleSizePacked || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
      {fields.filter(f => f.value !== undefined && f.value !== null && f.value !== '').map((f, i) => (
        <DataRow key={`f${i}`} label={f.label} value={f.value} rowIdx={valid.length + i} />
      ))}
    </>
  );
}

// ── Photo groups section ──────────────────────────────────────────────────────
function PhotoRows({ groups = [], allPhotos = [], setLightbox }) {
  if (!groups.length) {
    return (
      <tr>
        <td colSpan={2} style={{ padding: '8px 12px', fontSize: 12, color: '#9ca3af', border: `1px solid ${BORDER}`, fontStyle: 'italic' }}>
          No photos added.
        </td>
      </tr>
    );
  }

  return groups.map((g, gi) => {
    const thumbs = (g.photoIds || [])
      .map(id => allPhotos.find(p => p.id === id))
      .filter(Boolean);

    return (
      <tr key={g.id || gi} style={{ background: gi % 2 === 0 ? '#fff' : '#fafbff' }}>
        <td style={{ padding: '6px 12px', fontWeight: 600, fontSize: 12, color: '#374151', border: `1px solid ${BORDER}`, verticalAlign: 'top', width: '35%' }}>
          <div>{gi + 1}. {g.description || `Group ${gi + 1}`}</div>
          <div style={{ fontWeight: 400, fontSize: 11, color: '#64748b', marginTop: 2 }}>{thumbs.length} photo{thumbs.length !== 1 ? 's' : ''}</div>
        </td>
        <td style={{ padding: '8px 12px', border: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
          {thumbs.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {thumbs.map((photo, pi) => (
                <img
                  key={pi}
                  src={photo.preview}
                  alt={photo.label || `Photo ${pi + 1}`}
                  onClick={() => setLightbox(photo.preview)}
                  title={photo.label || ''}
                  style={{
                    width: 72, height: 72,
                    objectFit: 'cover',
                    borderRadius: 3,
                    border: '1px solid #d1d5db',
                    cursor: 'zoom-in',
                  }}
                />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No photos in this group.</span>
          )}
        </td>
      </tr>
    );
  });
}

// ── Overall conclusion footer ─────────────────────────────────────────────────
function ConclusionFooter({ value }) {
  if (!value) return null;
  const rb = resultBadge(value) || { color: '#374151', bg: '#f8fafc', border: '#d1d5db' };
  const emoji = String(value).toUpperCase() === 'PASSED' ? '✅' : String(value).toUpperCase() === 'FAILED' ? '❌' : '⏳';
  return (
    <div style={{
      marginTop: 0,
      padding: '14px 20px',
      background: rb.bg,
      border: `2px solid ${rb.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: rb.color, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75 }}>
            Overall Inspection Result
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: rb.color }}>
            {String(value).toUpperCase()}
          </div>
        </div>
      </div>
      <div style={{
        padding: '6px 20px',
        background: rb.border,
        color: '#fff',
        borderRadius: 4,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: '0.06em',
      }}>
        {String(value).toUpperCase()}
      </div>
    </div>
  );
}

// ── Extract a field value from sections by label (for header) ─────────────────
function pickField(sections, sectionTitle, fieldLabel) {
  const sec = sections.find(s => s.title === sectionTitle);
  if (!sec) return '';
  const f = (sec.fields || []).find(f => f.label === fieldLabel);
  return f?.value || '';
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportReview({
  sections = [],
  conclusion,
  onEditStep,
  onPrev,
  onNext,
  hideNav = false,
  allPhotos = [],
}) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Pull a few fields for the document header
  const client      = pickField(sections, 'General Information', 'Client');
  const factory     = pickField(sections, 'General Information', 'Factory');
  const inspDate    = pickField(sections, 'General Information', 'Inspection Date');
  const poNo        = pickField(sections, 'General Information', 'PO Number');
  const product     = pickField(sections, 'General Information', 'Product');

  return (
    <div>
      {/* Toolbar row */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Report Preview</h2>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
          Review your report before submitting. Click <strong>Edit</strong> on any section to go back and make changes.
        </p>
      </div>

      {/* ── Document paper ── */}
      <div style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        fontFamily: 'inherit',
      }}>

        {/* Document header */}
        <div style={{ background: NAVY, color: '#fff', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 3 }}>
                Absolute Veritas Quality Services
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.01em' }}>
                PRE-SHIPMENT INSPECTION REPORT
              </div>
              {product && (
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{product}</div>
              )}
            </div>
            {/* Summary mini-table */}
            <div style={{ fontSize: 11, textAlign: 'right', opacity: 0.85, lineHeight: 1.7, flexShrink: 0 }}>
              {client   && <div><span style={{ opacity: 0.65 }}>Client: </span><strong>{client}</strong></div>}
              {factory  && <div><span style={{ opacity: 0.65 }}>Factory: </span><strong>{factory}</strong></div>}
              {poNo     && <div><span style={{ opacity: 0.65 }}>PO: </span><strong>{poNo}</strong></div>}
              {inspDate && <div><span style={{ opacity: 0.65 }}>Date: </span><strong>{inspDate}</strong></div>}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
            Draft — For Inspector Review Only
          </div>
        </div>

        {/* All sections as one contiguous table */}
        <div style={{ padding: '16px 20px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {sections.map((section, i) => (
                <>
                  <SectionHeader
                    key={`hdr-${i}`}
                    roman={ROMAN[i] || String(i + 1)}
                    title={section.title}
                    stepIndex={section.stepIndex}
                    onEdit={onEditStep}
                  />

                  {section.type === 'photos' ? (
                    <PhotoRows
                      key={`ph-${i}`}
                      groups={section.groups}
                      allPhotos={allPhotos}
                      setLightbox={setLightboxSrc}
                    />
                  ) : section.type === 'items' ? (
                    <ItemRows
                      key={`it-${i}`}
                      items={section.items}
                      fields={section.fields}
                    />
                  ) : (
                    <FieldRows key={`fr-${i}`} fields={section.fields} />
                  )}
                </>
              ))}
            </tbody>
          </table>

          <ConclusionFooter value={conclusion} />
        </div>
      </div>

      {!hideNav && (
        <div style={{ marginTop: 16 }}>
          <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Proceed to Submit →" />
        </div>
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
