const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirsToCreate = [
  'components/shared',
  'components/layout',
  'components/auth',
  'dashboards/inspector/components',
  'dashboards/inspector/hooks',
  'dashboards/inspector/utils',
  'dashboards/inspector/styles',
  'reports/PSI/components',
  'reports/PSI/hooks',
  'reports/PSI/utils',
  'reports/PSI/styles',
  'reports/CLS/components',
  'reports/CLS/hooks',
  'reports/CLS/utils',
  'reports/CLS/styles',
  'reports/DPI/components',
  'reports/DPI/hooks',
  'reports/DPI/utils',
  'reports/DPI/styles',
  'reports/FactoryAudit/components',
  'reports/FactoryAudit/hooks',
  'reports/FactoryAudit/utils',
  'reports/FactoryAudit/styles',
  'reports/SocialAudit/components',
  'reports/SocialAudit/hooks',
  'reports/SocialAudit/utils',
  'reports/SocialAudit/styles',
  'reports/shared/components',
  'reports/shared/hooks',
  'reports/shared/utils',
  'reports/shared/styles',
  'api/auth',
  'api/inspector',
  'api/manager',
  'api/admin',
  'api/common',
  'store/slices',
  'hooks',
  'utils',
  'styles',
  'config',
  'pages/inspector',
  'pages/manager',
  'pages/admin',
  'pages/auth'
];

dirsToCreate.forEach(dir => {
  const fullPath = path.join(srcDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});
