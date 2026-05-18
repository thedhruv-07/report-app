import React from 'react';
import SchemaRemarks from '../../shared/components/SchemaRemarks';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Remarks({ form, handleChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      <SchemaRemarks title="III. REMARKS - Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
      <SchemaRemarks title="III. REMARKS - General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
      <SchemaSection title="III. REMARKS - Sample Collection" fields={[{name: 'sampleCollection', label: 'Sample Collection Record', type: 'text'}]} formData={form} onChange={handleChange} />
      
      <div style={{ marginTop: "10px" }}>
        <SchemaPhotos 
          config={{ groups: [{ id: "remarkPhotos", label: "Remarks Photos" }] }} 
          formData={form} 
          onChange={handleChange} 
        />
      </div>
    </div>
  );
}
