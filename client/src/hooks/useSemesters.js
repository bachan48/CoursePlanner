import { useState, useEffect, useCallback } from 'react';
import { semesterAPI } from '../services/api';

export const useSemesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSemesters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await semesterAPI.getAll();
      setSemesters(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch semesters');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSemester = useCallback(async (data) => {
    const response = await semesterAPI.create(data);
    setSemesters((prev) => [response.data.data, ...prev]);
    return response.data.data;
  }, []);

  const updateSemester = useCallback(async (id, data) => {
    const response = await semesterAPI.update(id, data);
    setSemesters((prev) => prev.map((s) => (s._id === id ? response.data.data : s)));
    return response.data.data;
  }, []);

  const deleteSemester = useCallback(async (id) => {
    await semesterAPI.delete(id);
    setSemesters((prev) => prev.filter((s) => s._id !== id));
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  return {
    semesters,
    loading,
    error,
    fetchSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
  };
};
