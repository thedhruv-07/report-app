import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function InspectionSummary({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaSection title="II. INSPECTION SUMMARY" fields={schema.inspectionSummary} formData={form} onChange={handleChange} />
      <SchemaSection title="Workmanship Summary" fields={schema.workmanshipSummary} formData={form} onChange={handleChange} />
    </div>
  );
}