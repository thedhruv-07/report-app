import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function Conclusion({ form, handleChange }) {
  return (
    <SchemaSection 
      title="4. Overall Conclusion" 
      fields={form.schema.conclusion} 
      formData={form} 
      onChange={handleChange} 
    />
  );
}
