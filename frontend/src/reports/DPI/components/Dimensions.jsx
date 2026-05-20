import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Dimensions({ form, handleChange }) {
  const { schema } = form;
  // Prefer productSpecificationTable (labelled Product Specification) but fall back to dimensionsTable
  const cfg = schema.productSpecificationTable || schema.dimensionsTable;
  // Choose data key based on the actual form data (prefer productSpecificationTable if present)
  const key = (form && form.productSpecificationTable && Array.isArray(form.productSpecificationTable)) ? 'productSpecificationTable' : 'dimensionsTable';
  return <SchemaTable title="D. PRODUCT SPECIFICATION" config={cfg} dataKey={key} formData={form} onChange={handleChange} />;
}