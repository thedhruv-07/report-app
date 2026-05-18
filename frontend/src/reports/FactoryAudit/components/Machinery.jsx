import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import { colors } from '../../../styles';

export default function Machinery({ form, handleChange, setForm }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center" }}>Part 4: Machinery Conditions</h3>
      <SchemaTable title="Machines list" config={schema.part4.machineryConditions} dataKey="machineryConditions" formData={form} onChange={handleChange} />
      <SchemaSection title="Warehouse Condition" fields={schema.part4.warehouseCondition} formData={form} onChange={handleChange} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <SchemaPhotos config={{ groups: [schema.part4.warehousePhotos.rawMaterials] }} formData={form} onChange={handleChange} />
        <SchemaPhotos config={{ groups: [schema.part4.warehousePhotos.finishedProducts] }} formData={form} onChange={handleChange} />
      </div>
      <SchemaSection title="Sample room condition" fields={schema.part4.sampleRoomCondition} formData={form} onChange={handleChange} />
      <SchemaSection title="Public power supply" fields={schema.part4.publicPowerSupply} formData={form} onChange={handleChange} />
      <SchemaSection title="Shipment capabilities" fields={schema.part4.shipmentCapabilities} formData={form} onChange={handleChange} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <SchemaPhotos config={{ groups: [schema.part4.shipmentPhotos.loadingPlace1] }} formData={form} onChange={handleChange} />
        <SchemaPhotos config={{ groups: [schema.part4.shipmentPhotos.loadingPlace2] }} formData={form} onChange={handleChange} />
      </div>
      <div style={{ padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 4 Score</h4>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button key={num} onClick={() => setForm(prev => ({ ...prev, part4Score: num }))} style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`, backgroundColor: form.part4Score === num ? colors.danger : colors.surfaceAlt, color: form.part4Score === num ? "#fff" : colors.text, fontWeight: "bold", cursor: "pointer" }}>{num}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
