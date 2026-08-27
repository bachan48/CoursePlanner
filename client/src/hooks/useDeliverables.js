import { useState, useEffect, useCallback } from 'react';
import { deliverableAPI } from '../services/api';

export const useDeliverables = (params = {}) => {
  const { sprint, course } = params;

  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeliverables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deliverableAPI.getAll({ sprint, course });
      setDeliverables(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deliverables');
      return [];
    } finally {
      setLoading(false);
    }
  }, [sprint, course]);

  const createDeliverable = useCallback(async (data) => {
    const response = await deliverableAPI.create(data);
    setDeliverables((prev) => [...prev, response.data.data]);
    return response.data.data;
  }, []);

  const updateDeliverable = useCallback(async (id, data) => {
    const response = await deliverableAPI.update(id, data);
    setDeliverables((prev) => prev.map((d) => (d._id === id ? response.data.data : d)));
    return response.data.data;
  }, []);

  const deleteDeliverable = useCallback(async (id) => {
    await deliverableAPI.delete(id);
    setDeliverables((prev) => prev.filter((d) => d._id !== id));
  }, []);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  return {
    deliverables,
    loading,
    error,
    fetchDeliverables,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
  };
};
