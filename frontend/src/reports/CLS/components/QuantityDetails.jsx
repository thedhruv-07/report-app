import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function QuantityDetails({ form, handleChange }) {
  return (
    <SchemaTable 
      title="5. Quantity Details" 
      config={form.schema.quantityTable} 
      dataKey="quantityTable" 
      formData={form} 
      onChange={handleChange} 
      ai={false} 
    />
  );
}
