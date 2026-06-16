import { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../../config/api';

export const useAdminReportQueue = (filters = {}) => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const token = sessionStorage.getItem('reportToken');
      const response = await fetch(`${ENDPOINTS.ADMIN.REPORT_QUEUE}?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch admin report queue');
      const data = await response.json();
      setReports(data.reports || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type]);

  return { reports, stats, loading, error, refetch: fetchQueue };
};
