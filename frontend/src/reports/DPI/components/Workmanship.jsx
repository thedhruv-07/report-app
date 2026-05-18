import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Workmanship({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaTable title="B. WORKMANSHIP — Defect Details" config={schema.workmanshipTable} dataKey="workmanshipDefectTable" formData={form} onChange={handleChange} />
      <SchemaPhotos config={{ groups: [{ id: "defectPhotos", label: "Workmanship Defect Photos" }] }} formData={form} onChange={handleChange} />
    </div>
  );
}