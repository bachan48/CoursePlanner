import { useState, useEffect, useCallback } from 'react';
import { courseAPI } from '../services/api';

export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchCourses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await courseAPI.getAll(params);
      setCourses(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await courseAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch course stats:', err);
    }
  }, []);

  const createCourse = useCallback(async (data) => {
    try {
      const response = await courseAPI.create(data);
      setCourses(prev => [response.data.data, ...prev]);
      return response.data.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateCourse = useCallback(async (id, data) => {
    try {
      const response = await courseAPI.update(id, data);
      setCourses(prev =>
        prev.map(course =>
          course._id === id ? response.data.data : course
        )
      );
      return response.data.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteCourse = useCallback(async (id) => {
    try {
      await courseAPI.delete(id);
      setCourses(prev => prev.filter(course => course._id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [fetchCourses, fetchStats]);

  return {
    courses,
    loading,
    error,
    stats,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};