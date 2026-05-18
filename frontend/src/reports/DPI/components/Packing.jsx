import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Packing({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="E. PACKING" config={schema.packingTable} dataKey="packingTable" formData={form} onChange={handleChange} />;
}