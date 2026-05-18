import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function OnSiteTests({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="C. ON-SITE TESTS" config={schema.onSiteTestsTable} dataKey="onSiteTestsTable" formData={form} onChange={handleChange} />;
}