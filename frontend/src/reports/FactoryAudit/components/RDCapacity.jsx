import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import { colors } from '../../../styles';

export default function RDCapacity({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 6: R&D / Sampling Capacity</h3>
      <SchemaSection title="Facilities & Process" fields={schema.part6.rdFacilities} formData={form} onChange={handleChange} />
      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 6 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part6Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part6Score === num ? colors.danger : colors.surfaceAlt, color: form.part6Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
