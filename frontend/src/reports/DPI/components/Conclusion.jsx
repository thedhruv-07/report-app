import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function Conclusion({ form, handleChange }) {
  const { schema } = form;
  return <SchemaSection title="IV. CONCLUSION" fields={schema.conclusion} formData={form} onChange={handleChange} />;
}