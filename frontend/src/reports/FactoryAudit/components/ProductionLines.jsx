import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import { colors } from '../../../styles';

export default function ProductionLines({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 3: Production lines / Capacity</h3>
      <SchemaPhotos config={schema.part3.productionWorkflow} formData={form} onChange={handleChange} />
      <SchemaTable title="Production process" config={schema.part3.productionProcess} dataKey="productionProcess" formData={form} onChange={handleChange} />
      <SchemaSection title="Daily output check" fields={schema.part3.dailyOutputCheck} formData={form} onChange={handleChange} />
      <SchemaPhotos config={schema.part3.dailyOutputPhotos} formData={form} onChange={handleChange} />
      <SchemaSection title="Lead times" fields={schema.part3.leadTimes} formData={form} onChange={handleChange} />
      <SchemaSection title="Bottlenecks" fields={schema.part3.bottlenecks} formData={form} onChange={handleChange} />
      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 3 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part3Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part3Score === num ? colors.danger : colors.surfaceAlt, color: form.part3Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
