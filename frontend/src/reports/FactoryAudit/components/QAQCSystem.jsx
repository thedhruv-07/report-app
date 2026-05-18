import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import { colors } from '../../../styles';

export default function QAQCSystem({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 5: Quality Control System</h3>
      <SchemaSection title="Quality Management" fields={schema.part5.qualitySystemManagement} formData={form} onChange={handleChange} />
      <SchemaPhotos config={schema.part5.qualitySystemManagementPhotos} formData={form} onChange={handleChange} />
      <SchemaSection title="Certificates" fields={schema.part5.certificatesList} formData={form} onChange={handleChange} />
      <SchemaSection title="Inspection Track Record" fields={schema.part5.inspectionTrackRecord} formData={form} onChange={handleChange} />
      <SchemaSection title="QC Staff" fields={schema.part5.qcStaffCount} formData={form} onChange={handleChange} />
      <SchemaSection title="On-line QC" fields={schema.part5.onlineQC} formData={form} onChange={handleChange} />
      <SchemaPhotos config={schema.part5.onlineQCPhotos} formData={form} onChange={handleChange} />
      <SchemaSection title="Final QC" fields={schema.part5.finalQC} formData={form} onChange={handleChange} />
      <SchemaSection title="Incoming QC" fields={schema.part5.incomingQC} formData={form} onChange={handleChange} />
      <SchemaPhotos config={schema.part5.incomingQCPhotos} formData={form} onChange={handleChange} />
      <SchemaPhotos title="Test Equipment" config={schema.part5.testEquipmentPhotos} formData={form} onChange={handleChange} />
      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 5 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part5Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part5Score === num ? colors.danger : colors.surfaceAlt, color: form.part5Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
