const fs = require('fs');
const path = require('path');

const dpiCompDir = path.join(__dirname, 'src/reports/DPI/components');
if (!fs.existsSync(dpiCompDir)) fs.mkdirSync(dpiCompDir, { recursive: true });

const components = {
  'InspectionSummary.jsx': `import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function InspectionSummary({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaSection title="II. INSPECTION SUMMARY" fields={schema.inspectionSummary} formData={form} onChange={handleChange} />
      <SchemaSection title="Workmanship Summary" fields={schema.workmanshipSummary} formData={form} onChange={handleChange} />
    </div>
  );
}`,
  'Remarks.jsx': `import React from 'react';
import SchemaRemarks from '../../shared/components/SchemaRemarks';
import SchemaSection from '../../shared/components/SchemaSection';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Remarks({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      <SchemaRemarks title="III. REMARKS - Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
      <SchemaRemarks title="III. REMARKS - General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
      <SchemaSection title="Factory Information" fields={schema.factoryInfo} formData={form} onChange={handleChange} />
      <SchemaSection title="Sample Collection Record" fields={schema.sampleCollection} formData={form} onChange={handleChange} />
      <SchemaPhotos config={{ groups: [{ id: "remarkPhotos", label: "Remarks Photos" }] }} formData={form} onChange={handleChange} />
    </div>
  );
}`,
  'Conclusion.jsx': `import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function Conclusion({ form, handleChange }) {
  const { schema } = form;
  return <SchemaSection title="IV. CONCLUSION" fields={schema.conclusion} formData={form} onChange={handleChange} />;
}`,
  'QuantityDetails.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function QuantityDetails({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="A. QUANTITY" config={schema.quantityTable} dataKey="quantityTable" formData={form} onChange={handleChange} ai={false} />;
}`,
  'Workmanship.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Workmanship({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaTable title="B. WORKMANSHIP — Defect Details" config={schema.workmanshipTable} dataKey="workmanshipDefectTable" formData={form} onChange={handleChange} />
      <SchemaPhotos config={{ groups: [{ id: "defectPhotos", label: "Workmanship Defect Photos" }] }} formData={form} onChange={handleChange} />
    </div>
  );
}`,
  'OnSiteTests.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function OnSiteTests({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="C. ON-SITE TESTS" config={schema.onSiteTestsTable} dataKey="onSiteTestsTable" formData={form} onChange={handleChange} />;
}`,
  'Dimensions.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Dimensions({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="D. PRODUCT — Dimensions" config={schema.dimensionsTable} dataKey="dimensionsTable" formData={form} onChange={handleChange} />;
}`,
  'Packing.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Packing({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="E. PACKING" config={schema.packingTable} dataKey="packingTable" formData={form} onChange={handleChange} />;
}`,
  'Marking.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function Marking({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="F. MARKING & LABELING" config={schema.markingTable} dataKey="markingTable" formData={form} onChange={handleChange} />;
}`,
  'ProductionLine.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function ProductionLine({ form, handleChange }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <SchemaTable title="G. PRODUCTION LINE CHECKING" config={schema.productionLineTable} dataKey="productionLineTable" formData={form} onChange={handleChange} />
      <SchemaPhotos config={{ groups: [{ id: "productionLinePhotos", label: "Production Line Photos" }] }} formData={form} onChange={handleChange} />
    </div>
  );
}`,
  'ClientRequirement.jsx': `import React from 'react';
import SchemaTable from '../../shared/components/SchemaTable';

export default function ClientRequirement({ form, handleChange }) {
  const { schema } = form;
  return <SchemaTable title="H. CLIENT SPECIAL REQUIREMENTS" config={schema.clientRequirementTable} dataKey="clientRequirementTable" formData={form} onChange={handleChange} />;
}`,
  'ProductionSchedule.jsx': `import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';

export default function ProductionSchedule({ form, handleChange }) {
  const { schema } = form;
  return <SchemaSection title="I. PRODUCTION SCHEDULE" fields={schema.productionSchedule} formData={form} onChange={handleChange} />;
}`,
  'Photos.jsx': `import React from 'react';
import SchemaPhotos from '../../shared/components/SchemaPhotos';

export default function Photos({ form, handleChange }) {
  const { schema } = form;
  return <SchemaPhotos config={schema.photos} formData={form} onChange={handleChange} />;
}`,
  'FinalStep.jsx': `import React from 'react';
import { colors } from '../../../styles';

export default function FinalStep({ reportDownloaded, clearFormAfterDownload, submit, isGenerating }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", padding: "60px 0" }}>
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h3 style={{ fontSize: "28px", fontWeight: "900", color: colors.header, marginBottom: "15px" }}>Inspection Completed</h3>
        <p style={{ color: colors.textMuted, fontSize: "16px", marginBottom: "40px", lineHeight: "1.6" }}>
          Your During Production Inspection report has been successfully compiled. You can now download it in DOCX or PDF format.
        </p>

        {reportDownloaded && (
          <div style={{ marginBottom: "30px", padding: "14px 16px", border: \`1px solid \${colors.success}\`, borderRadius: "8px", background: "rgba(16, 185, 129, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ color: colors.text, fontWeight: "600", fontSize: "14px" }}>Report downloaded successfully. Ready to start a new one?</span>
            <button type="button" onClick={clearFormAfterDownload} style={{ padding: "8px 16px", background: colors.danger, border: "none", borderRadius: "6px", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>Clear Form</button>
          </div>
        )}

        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => submit('docx')} disabled={isGenerating}
            style={{ padding: "16px 32px", borderRadius: "12px", border: "none", background: colors.success, color: "#fff", fontWeight: "700", cursor: isGenerating ? "not-allowed" : "pointer", fontSize: "15px", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)", display: "flex", alignItems: "center", gap: "10px", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            {isGenerating ? "Generating..." : "Download DOCX"}
          </button>
          <button onClick={() => submit('pdf')} disabled={isGenerating}
            style={{ padding: "16px 32px", borderRadius: "12px", border: \`2px solid \${colors.primary}\`, background: "transparent", color: colors.primary, fontWeight: "700", cursor: isGenerating ? "not-allowed" : "pointer", fontSize: "15px", display: "flex", alignItems: "center", gap: "10px", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            {isGenerating ? "Preparing..." : "Download PDF"}
          </button>
        </div>
        
        <p style={{ marginTop: "30px", fontSize: "13px", color: colors.textMuted }}>
          Note: PDF generation may take a few seconds as it processes high-resolution images.
        </p>
      </div>
    </div>
  );
}`
};

Object.entries(components).forEach(([name, content]) => {
  fs.writeFileSync(path.join(dpiCompDir, name), content);
});

// Create index.js
const names = Object.keys(components).map(c => c.replace('.jsx', ''));
let indexContent = "export { default as GeneralInfo } from './GeneralInfo';\n";
names.forEach(n => {
  indexContent += `export { default as ${n} } from './${n}';\n`;
});
fs.writeFileSync(path.join(dpiCompDir, 'index.js'), indexContent);
