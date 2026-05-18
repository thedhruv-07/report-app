import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function ClientRequirement({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="H. CLIENT SPECIAL REQUIREMENTS" config={schema.clientRequirementTable} dataKey="clientRequirementTable" formData={form} onChange={handleChange} />;
}