import React, { useState } from 'react';
import SectionReviewPanel from './SectionReviewPanel';
import CorrectionForm from './CorrectionForm';
import RemarksPanel from './RemarksPanel';
import RevisionRoundIndicator from './RevisionRoundIndicator';
import { useReportReview } from '../hooks/useReportReview';

export default function ReviewInterface({ reportId, onClose }) {
  const [currentSection, setCurrentSection] = useState('General Info');
  const sections = ['General Info', 'Quantity', 'Workmanship', 'Inspection', 'Materials', 'Safety', 'Packaging', 'Comments', 'Media'];
  
  const { reportData, loading, error, submitFeedback, finalizeReport, addRemark } = useReportReview(reportId);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading report details...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  if (!reportData) return <div style={{ padding: '40px', textAlign: 'center' }}>Report not found.</div>;

  const { report, type } = reportData;
  const clientName = report.generalInfo?.clientName || report.generalInfo?.client || "Unknown Client";
  const inspectorName = report.userId?.name || "Unknown Inspector";
  const submittedAt = new Date(report.submittedAt || report.updatedAt).toLocaleDateString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#F3F4F6' }}>
      
      {/* Top Nav */}
      <div style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#4B5563', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
          ← Back to Queue
        </button>
        <div style={{ fontWeight: '700', color: '#111827', borderLeft: '1px solid #E5E7EB', paddingLeft: '20px' }}>
          Report ID: {report.reportNumber || `RPT-${report._id?.toString().slice(-6).toUpperCase()}`}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel: Summary & Navigation */}
        <div style={{ width: '280px', background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{clientName}</h3>
            <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span><strong>Type:</strong> {report.title || type}</span>
              <span><strong>Inspector:</strong> {inspectorName}</span>
              <span><strong>Submitted:</strong> {submittedAt}</span>
              <span><strong>Status:</strong> {report.operationStatus}</span>
            </div>
            <div style={{ marginTop: '15px' }}>
              <RevisionRoundIndicator round={report.revisionRound || 1} />
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
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%' }}>
            <SectionReviewPanel sectionId={currentSection} report={report} />
          </div>
        </div>

        {/* Right Panel: Controls & Feedback */}
        <div style={{ width: '350px', background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => finalizeReport().then(() => alert('Report Finalized!'))}
              style={{ padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              Finalize Report
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <CorrectionForm 
              sections={sections} 
              onSubmitFeedback={submitFeedback} 
            />
            <div style={{ margin: '30px 0', borderTop: '1px solid #E5E7EB' }}></div>
            <RemarksPanel 
              onAddRemark={addRemark} 
              existingRemarks={report.tmRemarks} 
            />
          </div>

        </div>

      </div>
    </div>
  );
}