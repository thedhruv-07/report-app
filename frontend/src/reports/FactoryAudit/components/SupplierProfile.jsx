import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import { colors } from '../../../styles';

export default function SupplierProfile({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 1: Supplier profile</h3>
      <SchemaSection title="General information" fields={schema.supplierProfile} formData={form} onChange={handleChange} />
      <SchemaSection title="Communication infrastructures" fields={schema.communicationInfrastructure} formData={form} onChange={handleChange} />
      <SchemaTable title="Products / markets" config={schema.productsMarkets} dataKey="productsMarkets" formData={form} onChange={handleChange} />
      <SchemaTable title="Recommendations / credentials" config={schema.recommendations} dataKey="recommendations" formData={form} onChange={handleChange} />
      
      <div style={{ background: colors.surfaceAlt, padding: "20px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px" }}>Related Pictures</h3>
        <SchemaPhotos config={schema.relatedPictures.buildingOffice} formData={form} onChange={handleChange} />
        <div style={{ marginTop: "20px" }}>
          <SchemaSection title="Building Certificate" fields={schema.relatedPictures.buildingCertificate} formData={form} onChange={handleChange} />
          <SchemaSection title="License accreditation" fields={schema.relatedPictures.licenseAccreditation} formData={form} onChange={handleChange} />
          <SchemaSection title="Export license" fields={schema.relatedPictures.exportLicense} formData={form} onChange={handleChange} />
          <SchemaSection title="Bank information" fields={schema.relatedPictures.bankInfo} formData={form} onChange={handleChange} />
        </div>
      </div>

      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 1 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part1Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part1Score === num ? colors.danger : colors.surfaceAlt, color: form.part1Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
