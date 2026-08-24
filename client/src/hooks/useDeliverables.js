import { useState, useEffect, useCallback } from 'react';
import { deliverableAPI } from '../services/api';

export const useDeliverables = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeliverables = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await deliverableAPI.getAll(params);
      setDeliverables(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deliverables');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcoming = useCallback(async (days = 7) => {
    try {
      const response = await deliverableAPI.getUpcoming(days);
      return response.data.data || [];
    } catch (err) {
      console.error('Failed to fetch upcoming deliverables:', err);
      return [];
    }
  }, []);

  const createDeliverable = useCallback(async (data) => {
    try {
      const response = await deliverableAPI.create(data);
      setDeliverables(prev => [response.data.data, ...prev]);
      return response.data.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateDeliverable = useCallback(async (id, data) => {
    try {
      const response = await deliverableAPI.update(id, data);
      setDeliverables(prev =>
        prev.map(del =>
          del._id === id ? response.data.data : del
        )
      );
      return response.data.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteDeliverable = useCallback(async (id) => {
    try {
      await deliverableAPI.delete(id);
      setDeliverables(prev => prev.filter(del => del._id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  return {
    deliverables,
    loading,
    error,
    fetchDeliverables,
    fetchUpcoming,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
  };
};