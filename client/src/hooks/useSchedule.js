import { useState, useEffect, useCallback } from 'react';
import { scheduleAPI } from '../services/api';

export const useSchedule = () => {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleAPI.getAll(params);
      setScheduleItems(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedule');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekly = useCallback(async () => {
    try {
      const response = await scheduleAPI.getWeekly();
      setWeeklySchedule(response.data.data || {});
    } catch (err) {
      console.error('Failed to fetch weekly schedule:', err);
    }
  }, []);

  const createScheduleItem = useCallback(async (data) => {
    try {
      const response = await scheduleAPI.create(data);
      setScheduleItems(prev => [...prev, response.data.data]);
      return response.data.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateScheduleItem = useCallback(async (id, data) => {
    try {
      const response = await scheduleAPI.update(id, data);
      setScheduleItems(prev =>
        prev.map(item =>
          item._id === id ? response.data.data : item
        )
      );
      return response.data.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteScheduleItem = useCallback(async (id) => {
    try {
      await scheduleAPI.delete(id);
      setScheduleItems(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    fetchWeekly();
  }, [fetchSchedule, fetchWeekly]);

  return {
    scheduleItems,
    weeklySchedule,
    loading,
    error,
    fetchSchedule,
    fetchWeekly,
    createScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
  };
};