import { useState, useEffect, useCallback } from 'react';
import { sprintAPI } from '../services/api';

export const useSprints = (courseId) => {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSprints = useCallback(async () => {
    if (!courseId) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await sprintAPI.getAll({ course: courseId });
      setSprints(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sprints');
      return [];
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const createSprint = useCallback(async (data) => {
    const response = await sprintAPI.create(data);
    setSprints((prev) => [...prev, response.data.data]);
    return response.data.data;
  }, []);

  const updateSprint = useCallback(async (id, data) => {
    const response = await sprintAPI.update(id, data);
    setSprints((prev) => prev.map((s) => (s._id === id ? response.data.data : s)));
    return response.data.data;
  }, []);

  const deleteSprint = useCallback(async (id) => {
    await sprintAPI.delete(id);
    setSprints((prev) => prev.filter((s) => s._id !== id));
  }, []);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  return {
    sprints,
    loading,
    error,
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
  };
};
