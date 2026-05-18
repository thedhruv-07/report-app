import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import { colors } from '../../../styles';

export default function Environment({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 7: Environment & Safety</h3>
      <SchemaSection title="Environment Management" fields={schema.part7.envManagement} formData={form} onChange={handleChange} />
      <SchemaSection title="Wastewater Report" fields={schema.part7.wastewaterReport} formData={form} onChange={handleChange} />
      <SchemaPhotos config={schema.part7.wastewaterPhotos} formData={form} onChange={handleChange} />
      <SchemaSection title="Control Record" fields={schema.part7.controlTrackRecord} formData={form} onChange={handleChange} />
      <SchemaTable title="Preventive Actions" config={schema.part7.preventiveActions} dataKey="preventiveActions" formData={form} onChange={handleChange} ai={false} />
      <SchemaTable title="Environment Photos" config={schema.part7.envPhotos} dataKey="envPhotos" formData={form} onChange={handleChange} ai={false} />
      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 7 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part7Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part7Score === num ? colors.danger : colors.surfaceAlt, color: form.part7Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
