import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function QuantityDetails({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="A. QUANTITY" config={schema.quantityTable} dataKey="quantityTable" formData={form} onChange={handleChange} ai={false} />;
}