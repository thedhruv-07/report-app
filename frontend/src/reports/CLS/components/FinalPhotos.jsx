import React from 'react';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function FinalPhotos({ form, handleChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaPhotos 
        config={{ groups: [{ id: "generalPhotos", label: "F. PHOTOS" }] }} 
        formData={form} 
        onChange={handleChange} 
      />
    </div>
  );
}
