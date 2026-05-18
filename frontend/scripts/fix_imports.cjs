const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Map of basename (without ext) to its new absolute path in src
const componentMap = {
  'Navbar': 'components/shared/Navbar.jsx',
  'Sidebar': 'components/shared/Sidebar.jsx',
  'SmartTextarea': 'components/shared/SmartTextarea.jsx',
  'ServiceCard': 'components/shared/ServiceCard.jsx',
  'ReportLoader': 'components/shared/ReportLoader.jsx',
  'DashboardLayout': 'components/layout/DashboardLayout.jsx',
  'ProtectedRoute': 'components/auth/ProtectedRoute.jsx',
  'AuthLayout': 'components/layout/AuthLayout.jsx',
  'InspectorDashboard': 'dashboards/inspector/InspectorDashboard.jsx',
  'Dashboard': 'dashboards/inspector/InspectorDashboard.jsx', // Was Dashboard.jsx
  'PSIForm': 'reports/PSI/PSIForm.jsx', // Was App.jsx
  'App': 'reports/PSI/PSIForm.jsx',
  'ContainerLoading': 'reports/CLS/CLSForm.jsx',
  'CLSForm': 'reports/CLS/CLSForm.jsx',
  'DuringProductionInspection': 'reports/DPI/DPIForm.jsx',
  'DPIForm': 'reports/DPI/DPIForm.jsx',
  'FactoryAudit': 'reports/FactoryAudit/FactoryAuditForm.jsx',
  'FactoryAuditForm': 'reports/FactoryAudit/FactoryAuditForm.jsx',

  // PSI
  'GeneralInfo': 'reports/PSI/components/SectionA_Summary.jsx',
  'SectionA_Summary': 'reports/PSI/components/SectionA_Summary.jsx',
  'InspectionSummaryTable': 'reports/PSI/components/InspectionSummaryTable.jsx',
  'RemarksStep': 'reports/PSI/components/RemarksStep.jsx',
  'QuantityDetails': 'reports/PSI/components/QuantityDetails.jsx',
  'ConclusionStep': 'reports/PSI/components/ConclusionStep.jsx',
  'WorkmanshipDefects': 'reports/PSI/components/WorkmanshipDefects.jsx',
  'OnSiteTests': 'reports/PSI/components/OnSiteTests.jsx',
  'ProductSpecification': 'reports/PSI/components/ProductSpecification.jsx',
  'FinalDetails': 'reports/PSI/components/FinalDetails.jsx',
  'MarkingLabeling': 'reports/PSI/components/MarkingLabeling.jsx',
  'ClientSpecialRequirement': 'reports/PSI/components/ClientSpecialRequirement.jsx',
  'Photos': 'reports/PSI/components/Photos.jsx',
  'FinalStep': 'reports/PSI/components/FinalStep.jsx',

  // FormBuilder / Shared
  'CLSPackingTable': 'reports/shared/components/CLSPackingTable.jsx',
  'LoadingProcessTable': 'reports/shared/components/LoadingProcessTable.jsx',
  'ProductConformityTable': 'reports/shared/components/ProductConformityTable.jsx',
  'SchemaChecklist': 'reports/shared/components/SchemaChecklist.jsx',
  'SchemaChecklistTable': 'reports/shared/components/SchemaChecklistTable.jsx',
  'SchemaPhotos': 'reports/shared/components/SchemaPhotos.jsx',
  'SchemaRemarks': 'reports/shared/components/SchemaRemarks.jsx',
  'SchemaSection': 'reports/shared/components/SchemaSection.jsx',
  'SchemaTable': 'reports/shared/components/SchemaTable.jsx',
};

// Also let's handle utilities and configs, even if they didn't move, their relative paths from moved files have changed.
const staticFiles = {
  'api': 'config/api.js',
  'imageCompression': 'utils/imageCompression.js',
  'reportUtils': 'utils/reportUtils.js',
  'AuthContext': 'context/AuthContext.jsx',
  'styles': 'styles.js', // Or pdf/styles.js... wait, styles in root?
  'services': 'shared/services.js',
  'dpiSchema': 'shared/dpiSchema.js',
  'faSchema': 'shared/faSchema.js',
  'formSchemas': 'shared/formSchemas.js',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      callback(dirPath);
    }
  });
}

function resolveImport(filePath, importPath) {
  // Regex to extract the basename
  const parts = importPath.split('/');
  let baseName = parts[parts.length - 1];
  baseName = baseName.replace(/\.(js|jsx)$/, '');

  let targetRelativeSrc = componentMap[baseName] || staticFiles[baseName];
  
  if (targetRelativeSrc) {
    const targetAbs = path.join(srcDir, targetRelativeSrc);
    const currentDir = path.dirname(filePath);
    let newRelative = path.relative(currentDir, targetAbs);
    newRelative = newRelative.replace(/\\/g, '/');
    if (!newRelative.startsWith('.')) {
      newRelative = './' + newRelative;
    }
    // Remove extension if it was jsx and we are importing without it
    // Actually, vite is fine with extensions or without. Let's keep it as is.
    if (!importPath.endsWith('.jsx') && newRelative.endsWith('.jsx')) {
      newRelative = newRelative.replace(/\.jsx$/, '');
    }
    if (!importPath.endsWith('.js') && newRelative.endsWith('.js')) {
      newRelative = newRelative.replace(/\.js$/, '');
    }
    return newRelative;
  }
  return null;
}

walkDir(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Replace standard imports: import X from 'path'
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  content = content.replace(importRegex, (match, p1) => {
    if (p1.startsWith('.')) { // Only process relative imports
      const newPath = resolveImport(filePath, p1);
      if (newPath && newPath !== p1) {
        modified = true;
        return `from '${newPath}'`;
      }
    }
    return match;
  });

  // Replace dynamic imports or require
  const importFuncRegex = /import\(['"]([^'"]+)['"]\)/g;
  content = content.replace(importFuncRegex, (match, p1) => {
    if (p1.startsWith('.')) {
      const newPath = resolveImport(filePath, p1);
      if (newPath && newPath !== p1) {
        modified = true;
        return `import('${newPath}')`;
      }
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated imports in: ${path.relative(srcDir, filePath)}`);
  }
});
