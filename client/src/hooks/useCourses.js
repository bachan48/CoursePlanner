import { useState, useEffect, useCallback } from 'react';
import { courseAPI } from '../services/api';

export const useCourses = (params = {}) => {
  const { semester } = params;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await courseAPI.getAll(semester ? { semester } : {});
      setCourses(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
      return [];
    } finally {
      setLoading(false);
    }
  }, [semester]);

  const createCourse = useCallback(async (data) => {
    const response = await courseAPI.create(data);
    setCourses(prev => [response.data.data, ...prev]);
    return response.data.data;
  }, []);

  const updateCourse = useCallback(async (id, data) => {
    const response = await courseAPI.update(id, data);
    setCourses(prev =>
      prev.map(course =>
        course._id === id ? response.data.data : course
      )
    );
    return response.data.data;
  }, []);

  const deleteCourse = useCallback(async (id) => {
    await courseAPI.delete(id);
    setCourses(prev => prev.filter(course => course._id !== id));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};
