import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Marking({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="F. MARKING & LABELING" config={schema.markingTable} dataKey="markingTable" formData={form} onChange={handleChange} />;
}