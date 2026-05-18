import React from 'react';
import ProductConformityTable from '../../shared/components/ProductConformityTable';

export default function ProductConformity({ form, handleChange }) {
  return <ProductConformityTable formData={form} onChange={handleChange} />;
}
