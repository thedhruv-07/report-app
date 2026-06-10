import React, { useState } from 'react';
import { X, Plus, Lock, ChevronDown, Trash2 } from 'lucide-react';
import { ENDPOINTS } from '../../../config/api';

const INSPECTION_TYPES = ['PSI', 'CLS', 'DPI', 'factory_audit', 'social_audit'];

const EMPTY_TEST = () => ({ description: '', method: '', sampleSize: '' });

const EMPTY = {
  clientName: '', clientEmail: '', clientPhone: '',
  inspectionType: 'PSI',
  factoryName: '', factoryAddress: '',
  scheduledDate: '', scheduledTime: '',
  productDescription: '', orderQuantity: '', poNumber: '', countryOfOrigin: '',
  aqlInspectionLevel: '', aqlSampleSize: '', aqlAcceptPoint: '', aqlRejectPoint: '',
  aqlInspectionStandard: '', aqlSamplingPlan: '',
  clientRequirementsText: '',
  onSiteTests: [EMPTY_TEST()],
  specialInstructions: '', adminNotes: '',
};

function Field({ label, required, locked, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
        {locked && <Lock size={10} color="#7c3aed" />}
      </label>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b',
  background: '#f8fafc', fontFamily: 'inherit', boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.15s',
};

const inpSm = {
  width: '100%', padding: '5px 7px', borderRadius: '6px',
  border: '1px solid #e2e8f0', fontSize: '12px', color: '#1e293b',
  background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box',
  outline: 'none',
};

const focusIndigo = (e) => { e.target.style.borderColor = '#6366f1'; };
const focusViolet = (e) => { e.target.style.borderColor = '#7c3aed'; };
const blur        = (e) => { e.target.style.borderColor = '#e2e8f0'; };

export default function NewBookingModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── On-site test row helpers ──────────────────────────────────────────────
  const addTest = () => set('onSiteTests', [...form.onSiteTests, EMPTY_TEST()]);
  const removeTest = (i) => set('onSiteTests', form.onSiteTests.filter((_, idx) => idx !== i));
  const updateTest = (i, field, val) => set('onSiteTests', form.onSiteTests.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim())  e.clientName  = 'Required';
    if (!form.clientEmail.trim()) e.clientEmail = 'Required';
    if (!form.inspectionType)     e.inspectionType = 'Required';
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setApiError('');
    try {
      const body = { ...form };
      if (body.orderQuantity !== '') body.orderQuantity = Number(body.orderQuantity);
      else delete body.orderQuantity;
      if (body.aqlSampleSize !== '')  body.aqlSampleSize  = Number(body.aqlSampleSize);  else delete body.aqlSampleSize;
      if (body.aqlAcceptPoint !== '') body.aqlAcceptPoint = Number(body.aqlAcceptPoint); else delete body.aqlAcceptPoint;
      if (body.aqlRejectPoint !== '') body.aqlRejectPoint = Number(body.aqlRejectPoint); else delete body.aqlRejectPoint;
      // Convert client requirements text → plain string stored on booking
      body.clientRequirements = body.clientRequirementsText || '';
      delete body.clientRequirementsText;
      // Filter blank test rows
      body.onSiteTests = (body.onSiteTests || []).filter(t => t.description.trim());

      const res = await fetch(ENDPOINTS.BOOKINGS.ADMIN_LIST, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create booking');
      onCreated?.();
      onClose();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const thStyle = { padding: '6px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' };
  const tdStyle = { padding: '4px 6px', border: '1px solid #e2e8f0', verticalAlign: 'middle' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }} />

      <div style={{ position: 'relative', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 64px rgba(15,23,42,0.18)', width: '100%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>New Booking</h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Create a booking manually — you can assign an inspector after saving.</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Client */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Client Name" required>
                <input style={{ ...inp, borderColor: errors.clientName ? '#ef4444' : '#e2e8f0' }} value={form.clientName} onChange={e => set('clientName', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="e.g. FRIN Trading" />
                {errors.clientName && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.clientName}</span>}
              </Field>
              <Field label="Client Email" required>
                <input style={{ ...inp, borderColor: errors.clientEmail ? '#ef4444' : '#e2e8f0' }} type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="client@example.com" />
                {errors.clientEmail && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.clientEmail}</span>}
              </Field>
              <Field label="Client Phone">
                <input style={inp} value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="+86 xxx xxxx xxxx" />
              </Field>
            </div>
          </div>

          {/* Inspection */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inspection Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Inspection Type" required>
                <div style={{ position: 'relative' }}>
                  <select style={{ ...inp, appearance: 'none', paddingRight: '28px', cursor: 'pointer', borderColor: errors.inspectionType ? '#ef4444' : '#e2e8f0' }} value={form.inspectionType} onChange={e => set('inspectionType', e.target.value)} onFocus={focusIndigo} onBlur={blur}>
                    {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                </div>
              </Field>
              <Field label="Scheduled Date">
                <input style={inp} type="date" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} onFocus={focusIndigo} onBlur={blur} />
              </Field>
              <Field label="Scheduled Time">
                <input style={inp} type="time" value={form.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} onFocus={focusIndigo} onBlur={blur} />
              </Field>
            </div>
          </div>

          {/* Factory */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Factory</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
              <Field label="Factory Name">
                <input style={inp} value={form.factoryName} onChange={e => set('factoryName', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="Supplier / Factory name" />
              </Field>
              <Field label="Factory Address">
                <input style={inp} value={form.factoryAddress} onChange={e => set('factoryAddress', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="City, Province, Country" />
              </Field>
            </div>
          </div>

          {/* Product */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Product</p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Product Description">
                <input style={inp} value={form.productDescription} onChange={e => set('productDescription', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="Describe the product to be inspected" />
              </Field>
              <Field label="Order Quantity">
                <input style={inp} type="number" min="0" value={form.orderQuantity} onChange={e => set('orderQuantity', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="e.g. 5000" />
              </Field>
              <Field label="PO Number">
                <input style={inp} value={form.poNumber} onChange={e => set('poNumber', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="e.g. PO-2026-001" />
              </Field>
              <Field label="Country of Origin">
                <input style={inp} value={form.countryOfOrigin} onChange={e => set('countryOfOrigin', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="e.g. China" />
              </Field>
            </div>
          </div>

          {/* AQL */}
          <div style={{ background: '#f5f3ff', border: '1px solid #e0d9ff', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> AQL Parameters — will be locked for inspector
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <Field label="Inspection Level" locked>
                <input style={inp} placeholder="e.g. Level II" value={form.aqlInspectionLevel} onChange={e => set('aqlInspectionLevel', e.target.value)} onFocus={focusViolet} onBlur={blur} />
              </Field>
              <Field label="Sample Size" locked>
                <input style={inp} type="number" min="0" placeholder="e.g. 200" value={form.aqlSampleSize} onChange={e => set('aqlSampleSize', e.target.value)} onFocus={focusViolet} onBlur={blur} />
              </Field>
              <Field label="Accept Point" locked>
                <input style={inp} type="number" min="0" placeholder="e.g. 10" value={form.aqlAcceptPoint} onChange={e => set('aqlAcceptPoint', e.target.value)} onFocus={focusViolet} onBlur={blur} />
              </Field>
              <Field label="Reject Point" locked>
                <input style={inp} type="number" min="0" placeholder="e.g. 11" value={form.aqlRejectPoint} onChange={e => set('aqlRejectPoint', e.target.value)} onFocus={focusViolet} onBlur={blur} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Inspection Standard" locked>
                <input style={inp} placeholder="e.g. ANSI/ASQ Z1.4 (ISO 2859-1)" value={form.aqlInspectionStandard} onChange={e => set('aqlInspectionStandard', e.target.value)} onFocus={focusViolet} onBlur={blur} />
              </Field>
              <Field label="Sampling Plan" locked>
                <input style={inp} placeholder="e.g. Fixed Sample Size" value={form.aqlSamplingPlan} onChange={e => set('aqlSamplingPlan', e.target.value)} onFocus={focusViolet} onBlur={blur} />
              </Field>
            </div>
          </div>

          {/* Client Requirements */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Special Requirements</p>
            <Field label="Requirements — one per line">
              <textarea
                style={{ ...inp, minHeight: '72px', resize: 'vertical' }}
                value={form.clientRequirementsText}
                onChange={e => set('clientRequirementsText', e.target.value)}
                onFocus={focusIndigo} onBlur={blur}
                placeholder={'e.g.\nLabel must be in English and Arabic\nPackaging must be export-grade\nCarton marking to include batch number'}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>Each line auto-fills a locked row in the inspector's Client Special Requirement section</span>
            </Field>
          </div>

          {/* On-Site Tests */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Required On-Site Tests</p>
              <button type="button" onClick={addTest} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #6366f1', background: '#eff0ff', color: '#6366f1', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                + Add Test
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '28px' }}>#</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Method</th>
                  <th style={{ ...thStyle, width: '100px' }}>Sample Size</th>
                  <th style={{ ...thStyle, width: '32px' }}></th>
                </tr>
              </thead>
              <tbody>
                {form.onSiteTests.map((t, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{i + 1}</td>
                    <td style={tdStyle}>
                      <input style={inpSm} value={t.description} onChange={e => updateTest(i, 'description', e.target.value)} placeholder="e.g. Drop Test" onFocus={focusIndigo} onBlur={blur} />
                    </td>
                    <td style={tdStyle}>
                      <input style={inpSm} value={t.method} onChange={e => updateTest(i, 'method', e.target.value)} placeholder="e.g. Drop from 1m height" onFocus={focusIndigo} onBlur={blur} />
                    </td>
                    <td style={tdStyle}>
                      <input style={inpSm} value={t.sampleSize} onChange={e => updateTest(i, 'sampleSize', e.target.value)} placeholder="e.g. 3 pcs" onFocus={focusIndigo} onBlur={blur} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button type="button" onClick={() => removeTest(i)} disabled={form.onSiteTests.length === 1} style={{ background: 'none', border: 'none', cursor: form.onSiteTests.length === 1 ? 'not-allowed' : 'pointer', color: form.onSiteTests.length === 1 ? '#cbd5e1' : '#ef4444', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Each row auto-fills a locked row in the inspector's On-Site Tests section</span>
          </div>

          {/* Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Special Instructions (for inspector)">
              <textarea style={{ ...inp, minHeight: '72px', resize: 'vertical' }} value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="Any specific requirements for the inspector…" />
            </Field>
            <Field label="Admin Notes (internal only)">
              <textarea style={{ ...inp, minHeight: '72px', resize: 'vertical' }} value={form.adminNotes} onChange={e => set('adminNotes', e.target.value)} onFocus={focusIndigo} onBlur={blur} placeholder="Internal notes not visible to inspector…" />
            </Field>
          </div>

          {apiError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
              {apiError}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 16px 16px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            After creating, click the booking to assign an inspector.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: saving ? '#a5b4fc' : '#6366f1', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? (
                <><span style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} /> Creating…</>
              ) : (
                <><Plus size={14} /> Create Booking</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
