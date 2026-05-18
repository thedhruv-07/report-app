import React from 'react';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import { colors } from '../../../styles';

export default function OrganizationChart({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 2: Factory Organization Chart</h3>
      <SchemaPhotos config={schema.part2.orgCharts} formData={form} onChange={handleChange} />
      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 2 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part2Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part2Score === num ? colors.danger : colors.surfaceAlt, color: form.part2Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
