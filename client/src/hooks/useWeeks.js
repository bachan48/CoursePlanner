import { useState, useEffect, useCallback } from 'react';
import { weekAPI } from '../services/api';

export const useWeeks = (courseId) => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeeks = useCallback(async () => {
    if (!courseId) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await weekAPI.getAll({ course: courseId });
      setWeeks(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch weeks');
      return [];
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const assignSprint = useCallback(async (weekIds, sprint) => {
    await weekAPI.assignSprint(weekIds, sprint);
    await fetchWeeks();
  }, [fetchWeeks]);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  return {
    weeks,
    loading,
    error,
    fetchWeeks,
    assignSprint,
  };
};
