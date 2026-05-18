import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function ClientRequirement({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaTable title="9. Client Special Requirements" config={schema.clientRequirementTable} dataKey="clientRequirementTable" formData={form} onChange={handleChange} />
      <SchemaPhotos 
        config={{ groups: [{ id: "clientRequirementPhotos", label: "Client Requirement Photos" }] }} 
        formData={form} 
        onChange={handleChange} 
      />
    </div>
  );
}
