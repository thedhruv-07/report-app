const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const fileMoves = [
  // Shared Components
  { from: 'components/Navbar.jsx', to: 'components/shared/Navbar.jsx' },
  { from: 'components/Sidebar.jsx', to: 'components/shared/Sidebar.jsx' },
  { from: 'components/SmartTextarea.jsx', to: 'components/shared/SmartTextarea.jsx' },
  { from: 'components/ServiceCard.jsx', to: 'components/shared/ServiceCard.jsx' },
  { from: 'components/ReportLoader.jsx', to: 'components/shared/ReportLoader.jsx' },
  
  // Layout Components
  { from: 'components/DashboardLayout.jsx', to: 'components/layout/DashboardLayout.jsx' },
  
  // Auth Layout
  { from: 'routes/ProtectedRoute.jsx', to: 'components/auth/ProtectedRoute.jsx' },
  { from: 'components/auth/AuthLayout.jsx', to: 'components/layout/AuthLayout.jsx' },

  // Dashboards
  { from: 'pages/Dashboard.jsx', to: 'dashboards/inspector/InspectorDashboard.jsx' },

  // Reports
  { from: 'App.jsx', to: 'reports/PSI/PSIForm.jsx' },
  { from: 'pages/services/ContainerLoading.jsx', to: 'reports/CLS/CLSForm.jsx' },
  { from: 'pages/services/DuringProductionInspection.jsx', to: 'reports/DPI/DPIForm.jsx' },
  { from: 'pages/services/FactoryAudit.jsx', to: 'reports/FactoryAudit/FactoryAuditForm.jsx' },

  // PSI Components
  { from: 'components/GeneralInfo.jsx', to: 'reports/PSI/components/SectionA_Summary.jsx' },
  { from: 'components/InspectionSummaryTable.jsx', to: 'reports/PSI/components/InspectionSummaryTable.jsx' },
  { from: 'components/RemarksStep.jsx', to: 'reports/PSI/components/RemarksStep.jsx' },
  { from: 'components/QuantityDetails.jsx', to: 'reports/PSI/components/QuantityDetails.jsx' },
  { from: 'components/ConclusionStep.jsx', to: 'reports/PSI/components/ConclusionStep.jsx' },
  { from: 'components/WorkmanshipDefects.jsx', to: 'reports/PSI/components/WorkmanshipDefects.jsx' },
  { from: 'components/OnSiteTests.jsx', to: 'reports/PSI/components/OnSiteTests.jsx' },
  { from: 'components/ProductSpecification.jsx', to: 'reports/PSI/components/ProductSpecification.jsx' },
  { from: 'components/FinalDetails.jsx', to: 'reports/PSI/components/FinalDetails.jsx' },
  { from: 'components/MarkingLabeling.jsx', to: 'reports/PSI/components/MarkingLabeling.jsx' },
  { from: 'components/ClientSpecialRequirement.jsx', to: 'reports/PSI/components/ClientSpecialRequirement.jsx' },
  { from: 'components/Photos.jsx', to: 'reports/PSI/components/Photos.jsx' },
  { from: 'components/FinalStep.jsx', to: 'reports/PSI/components/FinalStep.jsx' },

  // FormBuilder / Shared Report Components
  { from: 'components/FormBuilder/CLSPackingTable.jsx', to: 'reports/shared/components/CLSPackingTable.jsx' },
  { from: 'components/FormBuilder/LoadingProcessTable.jsx', to: 'reports/shared/components/LoadingProcessTable.jsx' },
  { from: 'components/FormBuilder/ProductConformityTable.jsx', to: 'reports/shared/components/ProductConformityTable.jsx' },
  { from: 'components/FormBuilder/SchemaChecklist.jsx', to: 'reports/shared/components/SchemaChecklist.jsx' },
  { from: 'components/FormBuilder/SchemaChecklistTable.jsx', to: 'reports/shared/components/SchemaChecklistTable.jsx' },
  { from: 'components/FormBuilder/SchemaPhotos.jsx', to: 'reports/shared/components/SchemaPhotos.jsx' },
  { from: 'components/FormBuilder/SchemaRemarks.jsx', to: 'reports/shared/components/SchemaRemarks.jsx' },
  { from: 'components/FormBuilder/SchemaSection.jsx', to: 'reports/shared/components/SchemaSection.jsx' },
  { from: 'components/FormBuilder/SchemaTable.jsx', to: 'reports/shared/components/SchemaTable.jsx' },
];

fileMoves.forEach(move => {
  const fromPath = path.join(srcDir, move.from);
  const toPath = path.join(srcDir, move.to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`Moved: ${move.from} -> ${move.to}`);
  } else {
    console.log(`Not found: ${move.from}`);
  }
});
