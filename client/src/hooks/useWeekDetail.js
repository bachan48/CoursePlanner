import { useState, useEffect, useCallback } from 'react';
import { weekAPI } from '../services/api';

export const useWeekDetail = (weekId) => {
  const [week, setWeek] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeek = useCallback(async () => {
    if (!weekId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await weekAPI.getById(weekId);
      const { week: weekData, sessions: sessionData, deliverables: deliverableData } = response.data.data;
      setWeek(weekData);
      setSessions(sessionData || []);
      setDeliverables(deliverableData || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch week');
    } finally {
      setLoading(false);
    }
  }, [weekId]);

  const updateWeek = useCallback(async (data) => {
    const response = await weekAPI.update(weekId, data);
    setWeek(response.data.data);
    return response.data.data;
  }, [weekId]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  return {
    week,
    sessions,
    deliverables,
    loading,
    error,
    fetchWeek,
    updateWeek,
  };
};
