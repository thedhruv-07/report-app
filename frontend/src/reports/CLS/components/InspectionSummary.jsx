import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function InspectionSummary({ form, handleChange }) {
  return (
    <SchemaSection 
      title="2. Inspection Summary" 
      fields={form.schema.inspectionSummary} 
      formData={form} 
      onChange={handleChange} 
    />
  );
}
