import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Lock, ChevronDown, Trash2 } from 'lucide-react';
import { ENDPOINTS } from '../../../config/api';

const STATUS_LABELS = {
  new: 'New', assigned: 'Assigned', viewed: 'Viewed', accepted: 'Accepted',
  in_progress: 'In Progress', submitted: 'Submitted', under_review: 'Under Review',
  correction_requested: 'Correction Requested', finalized: 'Finalized', delivered: 'Delivered',
};

const INSPECTION_TYPES = ['PSI', 'CLS', 'DPI', 'factory_audit', 'social_audit'];

function Field({ label, children, locked }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {locked && <Lock size={10} color="#6366f1" />}
      </label>
      {children}
    </div>
  );
}

const inputCls = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b',
  background: '#f8fafc', fontFamily: 'inherit', boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.15s',
};

const lockedCls = {
  ...inputCls,
  background: '#f1f5f9',
  color: '#475569',
  cursor: 'not-allowed',
  borderColor: '#e2e8f0',
};

export default function BookingReviewModal({ booking, inspectors, token, onClose, onSaved, onAssigned }) {
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [taskProgress, setTaskProgress] = useState(null);

  // Populate draft from booking on open
  useEffect(() => {
    if (!booking) return;
    setDraft({
      clientName:          booking.clientName          || '',
      clientEmail:         booking.clientEmail         || '',
      clientPhone:         booking.clientPhone         || '',
      inspectionType:      booking.inspectionType      || 'PSI',
      factoryName:         booking.factoryName         || '',
      factoryAddress:      booking.factoryAddress      || '',
      scheduledDate:       booking.scheduledDate ? booking.scheduledDate.slice(0, 10) : '',
      scheduledTime:       booking.scheduledTime       || '',
      productDescription:  booking.productDescription  || '',
      orderQuantity:       booking.orderQuantity != null ? String(booking.orderQuantity) : '',
      poNumber:            booking.poNumber            || '',
      countryOfOrigin:     booking.countryOfOrigin     || '',
      aqlInspectionLevel:    booking.aqlInspectionLevel    || '',
      aqlSampleSize:         booking.aqlSampleSize  != null ? String(booking.aqlSampleSize)  : '',
      aqlAcceptPoint:        booking.aqlAcceptPoint != null ? String(booking.aqlAcceptPoint) : '',
      aqlRejectPoint:        booking.aqlRejectPoint != null ? String(booking.aqlRejectPoint) : '',
      aqlInspectionStandard: booking.aqlInspectionStandard || '',
      aqlSamplingPlan:       booking.aqlSamplingPlan       || '',
      clientRequirementsText: booking.clientRequirements   || '',
      onSiteTests:           Array.isArray(booking.onSiteTests) && booking.onSiteTests.length
        ? booking.onSiteTests.map(t => ({ description: t.description || '', method: t.method || '', sampleSize: t.sampleSize || '' }))
        : [{ description: '', method: '', sampleSize: '' }],
      specialInstructions: booking.specialInstructions || '',
      adminNotes:          booking.adminNotes          || '',
    });
    setSelectedInspectorId(booking.assignedInspectorId || '');
    setSaveError('');
    setSavedOk(false);
    setAssignError('');
    setTaskProgress(null);

    // Fetch inspector section-skip progress if booking has an assigned inspector
    if (booking.assignedInspectorId && booking.id) {
      fetch(ENDPOINTS.ADMIN.TASK_PROGRESS(booking.id), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.task) setTaskProgress(data.task); })
        .catch(() => {});
    }
  }, [booking]);

  if (!booking) return null;

  const set = (name, value) => {
    setDraft(prev => ({ ...prev, [name]: value }));
    setSavedOk(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSavedOk(false);
    try {
      const body = { ...draft };
      if (body.orderQuantity !== '') body.orderQuantity = Number(body.orderQuantity);
      else delete body.orderQuantity;
      if (body.aqlSampleSize !== '')  body.aqlSampleSize  = Number(body.aqlSampleSize);  else delete body.aqlSampleSize;
      if (body.aqlAcceptPoint !== '') body.aqlAcceptPoint = Number(body.aqlAcceptPoint); else delete body.aqlAcceptPoint;
      if (body.aqlRejectPoint !== '') body.aqlRejectPoint = Number(body.aqlRejectPoint); else delete body.aqlRejectPoint;
      // clientRequirements: store as plain text (inspector form converts to rows)
      body.clientRequirements = body.clientRequirementsText || '';
      delete body.clientRequirementsText;
      // Filter blank on-site test rows
      body.onSiteTests = (body.onSiteTests || []).filter(t => t.description.trim());

      const res = await fetch(ENDPOINTS.BOOKINGS.UPDATE(booking.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setSavedOk(true);
      onSaved?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedInspectorId) { setAssignError('Please select an inspector first.'); return; }
    setAssigning(true);
    setAssignError('');
    try {
      // Save latest edits first, then assign
      await handleSave();

      const res = await fetch(ENDPOINTS.BOOKINGS.ASSIGN(booking.id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedInspectorId: selectedInspectorId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Assignment failed');
      onAssigned?.();
      onClose();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const alreadyAssigned = booking.status !== 'new';
  const statusLabel = STATUS_LABELS[booking.status] || booking.status;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }} />

      <div style={{ position: 'relative', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 64px rgba(15,23,42,0.18)', width: '100%', maxWidth: '740px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Review Booking</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>#{booking.id?.slice(-8).toUpperCase()}</span>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: alreadyAssigned ? '#ede9fe' : '#f1f5f9', color: alreadyAssigned ? '#6d28d9' : '#64748b' }}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Section: Client ── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Client Name">
                <input style={inputCls} value={draft.clientName || ''} onChange={e => set('clientName', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Client Email">
                <input style={inputCls} type="email" value={draft.clientEmail || ''} onChange={e => set('clientEmail', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Client Phone">
                <input style={inputCls} value={draft.clientPhone || ''} onChange={e => set('clientPhone', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
            </div>
          </div>

          {/* ── Section: Inspection ── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inspection Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Inspection Type">
                <div style={{ position: 'relative' }}>
                  <select style={{ ...inputCls, appearance: 'none', paddingRight: '28px', cursor: 'pointer' }} value={draft.inspectionType || ''} onChange={e => set('inspectionType', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}>
                    {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                </div>
              </Field>
              <Field label="Scheduled Date">
                <input style={inputCls} type="date" value={draft.scheduledDate || ''} onChange={e => set('scheduledDate', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Scheduled Time">
                <input style={inputCls} type="time" value={draft.scheduledTime || ''} onChange={e => set('scheduledTime', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
            </div>
          </div>

          {/* ── Section: Factory ── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Factory</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
              <Field label="Factory Name">
                <input style={inputCls} value={draft.factoryName || ''} onChange={e => set('factoryName', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Factory Address">
                <input style={inputCls} value={draft.factoryAddress || ''} onChange={e => set('factoryAddress', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
            </div>
          </div>

          {/* ── Section: Product ── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Product</p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Product Description">
                <input style={inputCls} value={draft.productDescription || ''} onChange={e => set('productDescription', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Order Quantity">
                <input style={inputCls} type="number" min="0" value={draft.orderQuantity || ''} onChange={e => set('orderQuantity', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="PO Number">
                <input style={inputCls} value={draft.poNumber || ''} onChange={e => set('poNumber', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} placeholder="e.g. PO-2026-001" />
              </Field>
              <Field label="Country of Origin">
                <input style={inputCls} value={draft.countryOfOrigin || ''} onChange={e => set('countryOfOrigin', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} placeholder="e.g. China" />
              </Field>
            </div>
          </div>

          {/* ── Section: AQL — locked for inspector ── */}
          <div style={{ background: '#f5f3ff', border: '1px solid #e0d9ff', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> AQL Parameters — set by CS, locked for inspector
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <Field label="Inspection Level" locked>
                <input style={inputCls} placeholder="e.g. Level II" value={draft.aqlInspectionLevel || ''} onChange={e => set('aqlInspectionLevel', e.target.value)} onFocus={e => { e.target.style.borderColor = '#7c3aed'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Sample Size" locked>
                <input style={inputCls} type="number" min="0" placeholder="e.g. 200" value={draft.aqlSampleSize || ''} onChange={e => set('aqlSampleSize', e.target.value)} onFocus={e => { e.target.style.borderColor = '#7c3aed'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Accept Point" locked>
                <input style={inputCls} type="number" min="0" placeholder="e.g. 10" value={draft.aqlAcceptPoint || ''} onChange={e => set('aqlAcceptPoint', e.target.value)} onFocus={e => { e.target.style.borderColor = '#7c3aed'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Reject Point" locked>
                <input style={inputCls} type="number" min="0" placeholder="e.g. 11" value={draft.aqlRejectPoint || ''} onChange={e => set('aqlRejectPoint', e.target.value)} onFocus={e => { e.target.style.borderColor = '#7c3aed'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Inspection Standard" locked>
                <input style={inputCls} placeholder="e.g. ANSI/ASQ Z1.4 (ISO 2859-1)" value={draft.aqlInspectionStandard || ''} onChange={e => set('aqlInspectionStandard', e.target.value)} onFocus={e => { e.target.style.borderColor = '#7c3aed'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
              <Field label="Sampling Plan" locked>
                <input style={inputCls} placeholder="e.g. Fixed Sample Size" value={draft.aqlSamplingPlan || ''} onChange={e => set('aqlSamplingPlan', e.target.value)} onFocus={e => { e.target.style.borderColor = '#7c3aed'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
              </Field>
            </div>
          </div>

          {/* ── Section: Client Requirements ── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Special Requirements</p>
            <Field label="Requirements — one per line">
              <textarea
                style={{ ...inputCls, minHeight: '72px', resize: 'vertical' }}
                value={draft.clientRequirementsText || ''}
                onChange={e => set('clientRequirementsText', e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                placeholder={'e.g.\nLabel must be in English and Arabic\nPackaging must be export-grade'}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>Each line auto-fills a locked row in the inspector's Client Special Requirement section</span>
            </Field>
          </div>

          {/* ── Section: On-Site Tests (3-column table) ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Required On-Site Tests</p>
              <button type="button" onClick={() => set('onSiteTests', [...(draft.onSiteTests || []), { description: '', method: '', sampleSize: '' }])} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #6366f1', background: '#eff0ff', color: '#6366f1', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                + Add Test
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  {['#', 'Description', 'Method', 'Sample Size', ''].map((h, i) => (
                    <th key={i} style={{ padding: '6px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: i === 0 ? '28px' : i === 4 ? '32px' : i === 3 ? '100px' : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(draft.onSiteTests || []).map((t, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{i + 1}</td>
                    {['description', 'method', 'sampleSize'].map(field => (
                      <td key={field} style={{ padding: '4px 6px', border: '1px solid #e2e8f0' }}>
                        <input
                          style={{ width: '100%', padding: '5px 7px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#1e293b', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                          value={t[field]}
                          onChange={e => set('onSiteTests', draft.onSiteTests.map((row, idx) => idx === i ? { ...row, [field]: e.target.value } : row))}
                          placeholder={field === 'description' ? 'e.g. Drop Test' : field === 'method' ? 'e.g. Drop from 1m' : 'e.g. 3 pcs'}
                          onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <button type="button" onClick={() => set('onSiteTests', draft.onSiteTests.filter((_, idx) => idx !== i))} disabled={(draft.onSiteTests || []).length === 1} style={{ background: 'none', border: 'none', cursor: (draft.onSiteTests || []).length === 1 ? 'not-allowed' : 'pointer', color: (draft.onSiteTests || []).length === 1 ? '#cbd5e1' : '#ef4444', display: 'flex', alignItems: 'center', margin: '0 auto' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Each row auto-fills a locked row in the inspector's On-Site Tests section</span>
          </div>

          {/* ── Section: Notes ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Special Instructions (for inspector)">
              <textarea style={{ ...inputCls, minHeight: '72px', resize: 'vertical' }} value={draft.specialInstructions || ''} onChange={e => set('specialInstructions', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </Field>
            <Field label="Admin Notes (internal only)">
              <textarea style={{ ...inputCls, minHeight: '72px', resize: 'vertical' }} value={draft.adminNotes || ''} onChange={e => set('adminNotes', e.target.value)} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </Field>
          </div>

          {/* ── Section: Assign Inspector ── */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={12} /> {alreadyAssigned ? 'Reassign Inspector' : 'Assign Inspector'}
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Field label="Select Inspector">
                  <div style={{ position: 'relative' }}>
                    <select
                      style={{ ...inputCls, appearance: 'none', paddingRight: '28px', cursor: 'pointer', background: '#fff' }}
                      value={selectedInspectorId}
                      onChange={e => { setSelectedInspectorId(e.target.value); setAssignError(''); }}
                      onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                    >
                      <option value="">— Select an inspector —</option>
                      {inspectors.map(ins => (
                        <option key={ins._id} value={ins._id}>{ins.name || ins.email}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                  </div>
                </Field>
              </div>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedInspectorId}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: assigning || !selectedInspectorId ? '#93c5fd' : '#1d4ed8', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: assigning || !selectedInspectorId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', height: '38px' }}
              >
                {assigning ? (
                  <><span style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} /> Assigning…</>
                ) : (
                  <><UserPlus size={14} /> {alreadyAssigned ? 'Reassign' : 'Assign & Notify'}</>
                )}
              </button>
            </div>
            {assignError && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#dc2626' }}>{assignError}</p>}
          </div>

          {/* Inspector Progress — section skip reasons */}
          {taskProgress?.sectionSkipReasons?.length > 0 && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚠️ Inspector Skipped Sections
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {taskProgress.sectionSkipReasons.map((r, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309' }}>{r.stepLabel || `Step ${r.step}`}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{r.skippedAt ? new Date(r.skippedAt).toLocaleString() : ''}</span>
                    </div>
                    {r.missingFields?.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '4px' }}>
                        Missing: {r.missingFields.join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#374151', fontStyle: 'italic' }}>"{r.reason}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 16px 16px' }}>
          <div style={{ fontSize: '12px', color: saving ? '#6366f1' : savedOk ? '#16a34a' : saveError ? '#dc2626' : '#94a3b8' }}>
            {saving ? 'Saving changes…' : savedOk ? '✓ Changes saved' : saveError || 'Unsaved changes will be saved when you assign.'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: saving ? '#a5b4fc' : '#6366f1', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
