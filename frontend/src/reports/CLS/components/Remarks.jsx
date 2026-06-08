import SchemaRemarks from '../../shared/components/SchemaRemarks';
import SchemaPhotos from '../../shared/components/SchemaPhotos';
import RemarksExtras from '../../shared/components/RemarksExtras';

export default function Remarks({ form, handleChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      <SchemaRemarks title="III. Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
      <SchemaRemarks title="III. General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
      <RemarksExtras form={form} onChange={handleChange} />
      <div style={{ marginTop: "8px" }}>
        <SchemaPhotos config={{ groups: [{ id: "remarkPhotos", label: "Remarks Photos" }] }} formData={form} onChange={handleChange} />
      </div>
    </div>
  );
}
