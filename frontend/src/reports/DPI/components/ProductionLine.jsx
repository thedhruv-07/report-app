import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function ProductionLine({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaTable title="G. PRODUCTION LINE CHECKING" config={schema.productionLineTable} dataKey="productionLineTable" formData={form} onChange={handleChange} />
      <SchemaPhotos config={{ groups: [{ id: "productionLinePhotos", label: "Production Line Photos" }] }} formData={form} onChange={handleChange} />
    </div>
  );
}