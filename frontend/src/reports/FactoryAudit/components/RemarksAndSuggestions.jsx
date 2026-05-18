import React from 'react';
import SchemaRemarks from '../../shared/components/SchemaRemarks';
import { colors } from '../../../styles';

export default function RemarksAndSuggestions({ form, handleChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "10px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>3. Remarks</h3>
      <SchemaRemarks title="General Overview:" dataKey="generalOverviewRemarks" formData={form} onChange={handleChange} />
      <SchemaRemarks title="Client's special requirement" dataKey="clientSpecialRemarks" formData={form} onChange={handleChange} />
      <SchemaRemarks title="Suggestion:" dataKey="suggestions" formData={form} onChange={handleChange} />
    </div>
  );
}
