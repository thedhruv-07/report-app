import React, { useState } from 'react';

export default function CorrectionForm({ sections, onSubmitFeedback }) {
  const [priority, setPriority] = useState('advisory');
  const [section, setSection] = useState(sections[0]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return alert('Please enter a comment');
    setSubmitting(true);
    try {
      await onSubmitFeedback(section, comment, priority);
      setComment('');
      alert('Feedback added successfully');
    } catch {
      alert('Failed to add feedback');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#111827' }}>Feedback Form</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>Select Section</label>
          <select 
            value={section}
            onChange={(e) => setSection(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
          >
            {sections.map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>Comments</label>
          <textarea 
            rows="4" 
            placeholder="Describe the issue..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
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

        <button 
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', padding: '10px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Adding...' : 'Add Section Feedback'}
        </button>
      </div>
    </div>
  );
}