import React from 'react';
import CLSPackingTable from '../../shared/components/CLSPackingTable';

export default function Packing({ form, handleChange }) {
  return <CLSPackingTable formData={form} onChange={handleChange} />;
}
