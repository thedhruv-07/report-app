import React, { useState } from 'react';

export default function ManagerNotifications({ notifications, unreadCount, markAllAsRead }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: '5px' }}
      >
        <span style={{ fontSize: '24px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#DC2626', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '40px', right: '0', width: '320px', background: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 15px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Notifications</span>
            <span 
              onClick={markAllAsRead}
              style={{ fontSize: '12px', color: '#0052CC', cursor: 'pointer', fontWeight: '500' }}
            >
              Mark all read
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>No new notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '15px', borderBottom: '1px solid #F3F4F6', background: n.read ? '#fff' : '#EFF6FF', cursor: 'pointer' }}>
                  <div style={{ fontSize: '13px', color: '#1F2937', marginBottom: '4px' }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(n.time).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid #E5E7EB', fontSize: '12px', color: '#0052CC', cursor: 'pointer', fontWeight: '500' }}>
            View All Notifications
          </div>
        </div>
      )}
    </div>
  );
}