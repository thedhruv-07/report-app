import React from 'react';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Photos({ form, handleChange }) {
  const { schema } = form;
  return <SchemaPhotos config={schema.photos} formData={form} onChange={handleChange} />;
}