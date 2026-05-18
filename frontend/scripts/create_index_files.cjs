const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const targetDirs = [
  'components/shared',
  'components/layout',
  'reports/PSI/components',
  'reports/CLS',
  'reports/DPI',
  'reports/FactoryAudit',
  'reports/shared/components'
];

targetDirs.forEach(dirPath => {
  const fullPath = path.join(srcDir, dirPath);
  if (!fs.existsSync(fullPath)) return;

  const files = fs.readdirSync(fullPath).filter(f => (f.endsWith('.jsx') || f.endsWith('.js')) && f !== 'index.js');
  
  if (files.length === 0) return;

  let indexContent = '';
  
  files.forEach(file => {
    const baseName = file.replace(/\.(jsx|js)$/, '');
    // Assume default export for React components
    if (file.endsWith('.jsx')) {
      indexContent += `export { default as ${baseName} } from './${baseName}';\n`;
    } else {
      // For js files, we could export all, or we don't know if default or named.
      // Easiest is to export all:
      indexContent += `export * from './${baseName}';\n`;
    }
  });

  const indexPath = path.join(fullPath, 'index.js');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`Created index file: ${dirPath}/index.js`);
});
