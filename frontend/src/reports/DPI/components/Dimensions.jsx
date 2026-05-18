import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Dimensions({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="D. PRODUCT — Dimensions" config={schema.dimensionsTable} dataKey="dimensionsTable" formData={form} onChange={handleChange} />;
}