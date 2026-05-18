import React from 'react';
import SchemaRemarks from '../../shared/components/SchemaRemarks';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Remarks({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      <SchemaRemarks title="III. REMARKS - Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
      <SchemaRemarks title="III. REMARKS - General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
      <SchemaSection title="Factory Information" fields={schema.factoryInfo} formData={form} onChange={handleChange} />
      <SchemaSection title="Sample Collection Record" fields={schema.sampleCollection} formData={form} onChange={handleChange} />
      <SchemaPhotos config={{ groups: [{ id: "remarkPhotos", label: "Remarks Photos" }] }} formData={form} onChange={handleChange} />
    </div>
  );
}