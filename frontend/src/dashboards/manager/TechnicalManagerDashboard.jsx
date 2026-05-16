import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import ReviewInterface from './components/ReviewInterface';
import { useManagerNotifications } from './hooks/useManagerNotifications';

export default function TechnicalManagerDashboard() {
  const [activeReportId, setActiveReportId] = useState(null);
  // Notification hook kept for side-effects (socket connection)
  const notificationState = useManagerNotifications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#F3F4F6' }}>
      <main style={{ flex: 1 }}>
        {activeReportId ? (
          <ReviewInterface reportId={activeReportId} onClose={() => setActiveReportId(null)} />
        ) : (
          <HomeScreen onReviewReport={(id) => setActiveReportId(id)} />
        )}
      </main>
    </div>
  );
}