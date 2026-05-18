const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'dashboards', 'manager');

const dirs = [
  '',
  'components',
  'hooks',
  'utils',
  'constants',
  'styles'
];

dirs.forEach(d => {
  const dirPath = path.join(baseDir, d);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const files = {
  // Styles
  'styles/ManagerDashboard.module.css': `.container { display: flex; flex-direction: column; height: 100vh; background-color: #F3F4F6; }`,
  'styles/ReportQueue.module.css': `.queueContainer { padding: 20px; }`,
  'styles/ReviewInterface.module.css': `.reviewLayout { display: flex; height: calc(100vh - 60px); }`,
  'styles/CorrectionForm.module.css': `.formContainer { padding: 15px; }`,
  
  // Constants
  'constants/reportStatuses.js': `export const STATUSES = { PENDING: 'pending_review', REVIEWING: 'under_review', CORRECTION: 'correction_requested', FINALIZED: 'finalized' };`,
  'constants/correctionPriorities.js': `export const PRIORITIES = { CRITICAL: 'critical', ADVISORY: 'advisory' };`,
  
  // Utils
  'utils/formatReportData.js': `export const formatReportData = (data) => data;`,
  'utils/statusHelpers.js': `export const getStatusColor = (status) => status === 'finalized' ? 'green' : 'gray';`,
  
  // Hooks
  'hooks/useReportQueue.js': `import { useState } from 'react';\nexport const useReportQueue = () => { const [reports, setReports] = useState([]); return { reports, loading: false }; };`,
  'hooks/useReportReview.js': `import { useState } from 'react';\nexport const useReportReview = (id) => { const [report, setReport] = useState(null); return { report, loading: false }; };`,
  'hooks/useManagerNotifications.js': `import { useState } from 'react';\nexport const useManagerNotifications = () => { return { notifications: [], unreadCount: 0 }; };`,
  
  // Components
  'components/ManagerNotifications.jsx': `import React from 'react';\nexport default function ManagerNotifications() { return <div>🔔 0</div>; }`,
  'components/SummaryCards.jsx': `import React from 'react';\nexport default function SummaryCards() { return <div>Summary Cards</div>; }`,
  'components/ReportCard.jsx': `import React from 'react';\nexport default function ReportCard({ report, onClick }) { return <div onClick={() => onClick(report.id)}>Report Card</div>; }`,
  'components/FilterSortControls.jsx': `import React from 'react';\nexport default function FilterSortControls() { return <div>Filter & Sort</div>; }`,
  'components/ReportQueue.jsx': `import React from 'react';\nimport ReportCard from './ReportCard';\nimport FilterSortControls from './FilterSortControls';\nexport default function ReportQueue({ onReportClick }) { return <div><h2>Report Queue</h2><FilterSortControls/><ReportCard report={{id: 1}} onClick={onReportClick}/></div>; }`,
  'components/HomeScreen.jsx': `import React from 'react';\nimport SummaryCards from './SummaryCards';\nimport ReportQueue from './ReportQueue';\nexport default function HomeScreen({ onReportClick }) { return <div><SummaryCards /><ReportQueue onReportClick={onReportClick}/></div>; }`,
  'components/SectionReviewPanel.jsx': `import React from 'react';\nexport default function SectionReviewPanel() { return <div>Section Review Panel</div>; }`,
  'components/CorrectionForm.jsx': `import React from 'react';\nexport default function CorrectionForm() { return <div>Correction Form</div>; }`,
  'components/RemarksPanel.jsx': `import React from 'react';\nexport default function RemarksPanel() { return <div>Remarks Panel</div>; }`,
  'components/ReviewInterface.jsx': `import React from 'react';\nimport SectionReviewPanel from './SectionReviewPanel';\nimport CorrectionForm from './CorrectionForm';\nimport RemarksPanel from './RemarksPanel';\nexport default function ReviewInterface({ reportId, onClose }) { return <div><button onClick={onClose}>Back</button><h2>Reviewing Report {reportId}</h2><div style={{display: 'flex'}}><div style={{flex: 1}}><SectionReviewPanel /></div><div style={{width: '300px'}}><CorrectionForm /><RemarksPanel /></div></div></div>; }`,
  
  // Main Entry
  'TechnicalManagerDashboard.jsx': `import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import ReviewInterface from './components/ReviewInterface';
import ManagerNotifications from './components/ManagerNotifications';
import styles from './styles/ManagerDashboard.module.css';

export default function TechnicalManagerDashboard() {
  const [activeReportId, setActiveReportId] = useState(null);

  return (
    <div className={styles.container}>
      <header style={{ height: '60px', background: '#0052CC', color: 'white', display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center' }}>
        <h2>Technical Manager Dashboard</h2>
        <ManagerNotifications />
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {activeReportId ? (
          <ReviewInterface reportId={activeReportId} onClose={() => setActiveReportId(null)} />
        ) : (
          <HomeScreen onReportClick={(id) => setActiveReportId(id)} />
        )}
      </main>
    </div>
  );
}`,
  'index.js': `export { default as TechnicalManagerDashboard } from './TechnicalManagerDashboard';`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(path.join(baseDir, filePath), content);
});

console.log("Technical Manager Dashboard scaffolded successfully!");
