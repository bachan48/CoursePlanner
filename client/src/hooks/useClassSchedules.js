import { useState, useEffect, useCallback } from 'react';
import { classScheduleAPI } from '../services/api';

export const useClassSchedules = (courseId) => {
  const [classSchedules, setClassSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClassSchedules = useCallback(async () => {
    if (!courseId) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await classScheduleAPI.getAll({ course: courseId });
      setClassSchedules(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch class schedules');
      return [];
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const createClassSchedule = useCallback(async (data) => {
    const response = await classScheduleAPI.create(data);
    setClassSchedules((prev) => [...prev, response.data.data]);
    return response.data.data;
  }, []);

  const updateClassSchedule = useCallback(async (id, data) => {
    const response = await classScheduleAPI.update(id, data);
    setClassSchedules((prev) => prev.map((cs) => (cs._id === id ? response.data.data : cs)));
    return response.data.data;
  }, []);

  const deleteClassSchedule = useCallback(async (id) => {
    await classScheduleAPI.delete(id);
    setClassSchedules((prev) => prev.filter((cs) => cs._id !== id));
  }, []);

  useEffect(() => {
    fetchClassSchedules();
  }, [fetchClassSchedules]);

  return {
    classSchedules,
    loading,
    error,
    fetchClassSchedules,
    createClassSchedule,
    updateClassSchedule,
    deleteClassSchedule,
  };
};
