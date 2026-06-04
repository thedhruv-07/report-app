import { useState, useEffect, useCallback } from 'react';
import { ENDPOINTS } from '../../../config/api';

export const useReportReview = (id) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem("reportToken");
      const response = await fetch(ENDPOINTS.MANAGER.REPORT_DETAILS(id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report details');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const submitFeedback = async (section, comment, priority) => {
    const token = sessionStorage.getItem("reportToken");
    const response = await fetch(ENDPOINTS.MANAGER.SUBMIT_FEEDBACK(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ section, comment, priority })
    });
    if (!response.ok) throw new Error('Failed to submit feedback');
    await fetchReport();
  };

  const finalizeReport = async () => {
    const token = sessionStorage.getItem("reportToken");
    const response = await fetch(ENDPOINTS.MANAGER.FINALIZE(id), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to finalize report');
    await fetchReport();
  };

  const addRemark = async (text) => {
    const token = sessionStorage.getItem("reportToken");
    const response = await fetch(ENDPOINTS.MANAGER.ADD_REMARK(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Failed to add remark');
    await fetchReport();
  };

  return {
    reportData,
    loading,
    error,
    submitFeedback,
    finalizeReport,
    addRemark,
    refetch: fetchReport
  };
};
