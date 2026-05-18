import React from 'react';
import LoadingProcessTable from '../../shared/components/LoadingProcessTable';
import SchemaChecklistTable from '../../shared/components/SchemaChecklistTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function LoadingProcess({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <LoadingProcessTable formData={form} onChange={handleChange} />

      <SchemaChecklistTable title="8.1 Empty Container Check" items={schema.containerCheck} dataKey="containerCheck" formData={form} onChange={handleChange} />
      <SchemaPhotos 
        config={{ groups: [
          { id: "emptyContainerPhotos", label: "Empty Container Photos" },
          { id: "truckCheckPhotos", label: "Truck Check Photos" }
        ] }} 
        formData={form} 
        onChange={handleChange} 
      />

      <SchemaChecklistTable title="8.2 Loading Process Check" items={schema.loadingCheck} dataKey="loadingCheck" formData={form} onChange={handleChange} />
      <SchemaPhotos 
        config={{ groups: [
          { id: "loadingPhotos", label: "Loading Process Photos" }
        ] }} 
        formData={form} 
        onChange={handleChange} 
      />

      <SchemaChecklistTable 
        title="8.3 Container Closing" 
        items={schema.containerClosing} 
        dataKey="containerClosing" 
        formData={form} 
        onChange={handleChange}
        options={["Passed", "Actual finding", "N/A"]}
      />
      <SchemaPhotos 
        config={{ groups: [
          { id: "closingPhotos", label: "Container Closing Photos" },
          { id: "containerPhotos", label: "Container & Seal Photos" }
        ] }} 
        formData={form} 
        onChange={handleChange} 
      />
    </div>
  );
}
