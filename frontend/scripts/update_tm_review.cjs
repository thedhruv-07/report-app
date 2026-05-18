const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'dashboards', 'manager', 'components');

const writeComponent = (name, content) => {
  fs.writeFileSync(path.join(baseDir, name), content);
};

// --- ReviewInterface.jsx ---
writeComponent('ReviewInterface.jsx', `import React, { useState } from 'react';
import SectionReviewPanel from './SectionReviewPanel';
import CorrectionForm from './CorrectionForm';
import RemarksPanel from './RemarksPanel';
import RevisionRoundIndicator from './RevisionRoundIndicator';

export default function ReviewInterface({ reportId, onClose }) {
  const [currentSection, setCurrentSection] = useState('A');
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#F3F4F6' }}>
      
      {/* Top Nav */}
      <div style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#4B5563', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
          ← Back to Queue
        </button>
        <div style={{ fontWeight: '700', color: '#111827', borderLeft: '1px solid #E5E7EB', paddingLeft: '20px' }}>
          Report ID: {reportId || 'RPT-PSI-001245'}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel: Summary & Navigation */}
        <div style={{ width: '280px', background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Acme Corp</h3>
            <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span><strong>Type:</strong> PSI</span>
              <span><strong>Inspector:</strong> John Doe</span>
              <span><strong>Submitted:</strong> May 15, 2024</span>
              <span><strong>Status:</strong> Under Review</span>
            </div>
            <div style={{ marginTop: '15px' }}>
              <RevisionRoundIndicator round={1} />
            </div>
          </div>
          
          <div style={{ padding: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sections</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {sections.map(sec => (
                <button 
                  key={sec} 
                  onClick={() => setCurrentSection(sec)}
                  style={{ 
                    textAlign: 'left', padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                    background: currentSection === sec ? '#EFF6FF' : 'transparent',
                    color: currentSection === sec ? '#0052CC' : '#4B5563',
                    borderLeft: currentSection === sec ? '3px solid #0052CC' : '3px solid transparent'
                  }}
                >
                  Section {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%' }}>
            <SectionReviewPanel sectionId={currentSection} />
          </div>
        </div>

        {/* Right Panel: Controls & Feedback */}
        <div style={{ width: '350px', background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ padding: '10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Request Correction
            </button>
            <button style={{ padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Finalize Report
            </button>
            <button style={{ padding: '10px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Add Remarks Only
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <CorrectionForm />
            <div style={{ margin: '30px 0', borderTop: '1px solid #E5E7EB' }}></div>
            <RemarksPanel />
          </div>

        </div>

      </div>
    </div>
  );
}`);

// --- SectionReviewPanel.jsx ---
writeComponent('SectionReviewPanel.jsx', `import React from 'react';

export default function SectionReviewPanel({ sectionId }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ background: '#F9FAFB', padding: '15px 20px', borderBottom: '1px solid #E5E7EB' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>SECTION {sectionId}</h2>
      </div>
      <div style={{ padding: '30px 20px' }}>
        <div style={{ padding: '20px', border: '1px dashed #D1D5DB', borderRadius: '8px', textAlign: 'center', color: '#6B7280' }}>
          <p>Read-only display of Section {sectionId} data goes here.</p>
          <p>This matches the inspector's submitted form layout.</p>
        </div>
      </div>
    </div>
  );
}`);

// --- CorrectionForm.jsx ---
writeComponent('CorrectionForm.jsx', `import React, { useState } from 'react';

export default function CorrectionForm() {
  const [priority, setPriority] = useState('advisory');
  
  return (
    <div>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#111827' }}>Feedback Form</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>Select Section</label>
          <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
            <option>Section A - Summary</option>
            <option>Section B - Workmanship</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>Comments</label>
          <textarea 
            rows="4" 
            placeholder="Describe the issue..."
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>Priority</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
              <input type="radio" name="priority" checked={priority === 'critical'} onChange={() => setPriority('critical')} /> 
              <span style={{ color: '#DC2626', fontWeight: '600' }}>Critical</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
              <input type="radio" name="priority" checked={priority === 'advisory'} onChange={() => setPriority('advisory')} /> 
              <span style={{ color: '#F59E0B', fontWeight: '600' }}>Advisory</span>
            </label>
          </div>
        </div>

        <button style={{ width: '100%', padding: '10px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
          Add Section Feedback
        </button>
      </div>
    </div>
  );
}`);

// --- RemarksPanel.jsx ---
writeComponent('RemarksPanel.jsx', `import React from 'react';

export default function RemarksPanel() {
  return (
    <div>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#111827' }}>Internal Remarks</h3>
      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '15px' }}>Visible only to Admin. Not sent to inspector.</p>
      
      <textarea 
        rows="3" 
        placeholder="Add an internal note..."
        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', resize: 'vertical', marginBottom: '10px' }}
      />
      <button style={{ padding: '8px 12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
        Save Remark
      </button>
    </div>
  );
}`);

// --- RevisionRoundIndicator.jsx ---
writeComponent('RevisionRoundIndicator.jsx', `import React from 'react';

export default function RevisionRoundIndicator({ round }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: round > 1 ? '#FEF2F2' : '#F3F4F6', color: round > 1 ? '#DC2626' : '#4B5563', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
      <span style={{ fontSize: '14px' }}>🔄</span>
      Round {round} {round === 1 ? '(Initial)' : '(Resubmission)'}
    </div>
  );
}`);

console.log("Review components updated successfully!");
