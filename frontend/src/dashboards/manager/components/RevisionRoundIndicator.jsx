import React from 'react';

export default function RevisionRoundIndicator({ round }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: round > 1 ? '#FEF2F2' : '#F3F4F6', color: round > 1 ? '#DC2626' : '#4B5563', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
      <span style={{ fontSize: '14px' }}>🔄</span>
      Round {round} {round === 1 ? '(Initial)' : '(Resubmission)'}
    </div>
  );
}