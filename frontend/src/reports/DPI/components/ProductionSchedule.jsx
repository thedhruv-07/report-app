import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function ProductionSchedule({ form, handleChange }) {
  const { schema } = form;
  return <SchemaSection title="I. PRODUCTION SCHEDULE" fields={schema.productionSchedule} formData={form} onChange={handleChange} />;
}