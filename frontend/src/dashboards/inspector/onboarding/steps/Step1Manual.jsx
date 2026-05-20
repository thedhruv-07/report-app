// frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx
import { useState } from 'react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const MANUAL_SECTIONS = [
  {
    title: 'Welcome to Absolute Veritas',
    content: (
      <p>We are delighted to welcome you as a certified inspector at Absolute Veritas. Our mission is to provide world-class pre-shipment inspection services that protect our clients' supply chains and uphold the highest standards of quality assurance. As an inspector, you are the frontline guardian of that mission.</p>
    ),
  },
  {
    title: 'Your Role & Responsibilities',
    content: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>Conduct thorough, unbiased inspections at supplier facilities</li>
        <li>Document findings accurately using the IRMS Report App</li>
        <li>Submit final reports within 24 hours of inspection completion</li>
        <li>Escalate critical safety defects to your supervisor immediately</li>
        <li>Maintain professional conduct at all supplier sites at all times</li>
        <li>Protect client confidentiality and inspection findings</li>
      </ul>
    ),
  },
  {
    title: 'Overview of Inspection Types',
    content: (
      <div className="space-y-3">
        {[
          { type: 'PSI — Pre-Shipment Inspection', desc: 'Conducted when 100% of production is complete and at least 80% is packed. Verifies product quality, quantity, and carton markings against the purchase order.' },
          { type: 'CLS — Container Loading Survey', desc: 'Supervised loading of goods into shipping containers. Ensures correct quantities, loading patterns, and container conditions.' },
          { type: 'DPI — During Production Inspection', desc: 'Mid-production check at 20–40% completion. Catches quality issues early before they affect the full batch.' },
          { type: 'Factory Audit', desc: "Comprehensive assessment of a supplier's manufacturing capabilities, quality management systems, and social compliance." },
          { type: 'Social Audit', desc: 'Evaluates supplier compliance with labour standards, worker safety, and ethical business practices.' },
        ].map(item => (
          <div key={item.type} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">{item.type}</p>
            <p className="text-slate-600 mt-0.5 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Reporting Guidelines & Deadlines',
    content: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>All reports must be submitted via the IRMS platform — no external communication of results</li>
        <li>Deadline: final report within <strong>24 hours</strong> of inspection end time</li>
        <li>Photos must be clear, well-lit, and directly relevant to the findings</li>
        <li>Defect descriptions must use objective, factual language</li>
        <li>Never share inspection results directly with the factory or supplier</li>
      </ul>
    ),
  },
  {
    title: 'Code of Conduct',
    content: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>Decline all gifts, hospitality, or inducements from suppliers</li>
        <li>Maintain complete impartiality — your findings must reflect reality</li>
        <li>Dress professionally and arrive punctually for all assignments</li>
        <li>Report any conflicts of interest to management before accepting an assignment</li>
        <li>Report misconduct by colleagues through the appropriate channels immediately</li>
      </ul>
    ),
  },
  {
    title: 'Contact Information',
    content: (
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 space-y-1 text-sm">
        <p><span className="font-semibold">Operations Support:</span> cs@absoluteveritas.com</p>
        <p><span className="font-semibold">Emergency Escalations:</span> Contact your assigned Technical Manager</p>
        <p><span className="font-semibold">Platform Support:</span> Available through the Settings page in IRMS</p>
      </div>
    ),
  },
];

export default function Step1Manual({ onComplete }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.COMPLETE_STEP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'manualRead' }),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      await onComplete();
    } catch {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Inspector User Manual</h2>
          <p className="text-indigo-100 mt-1 text-sm">Please read the following carefully before proceeding.</p>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 text-slate-700 text-sm leading-relaxed">
          {MANUAL_SECTIONS.map(section => (
            <section key={section.title}>
              <h3 className="text-base font-bold text-slate-800 mb-3">{section.title}</h3>
              {section.content}
            </section>
          ))}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <p className="text-xs text-slate-500">Scroll through the full manual before confirming.</p>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              : 'I have read and understood the manual'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
