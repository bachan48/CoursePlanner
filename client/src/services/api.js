import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if NOT already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API methods
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  getMe: () => api.get('/auth/me'),
};

// Semester API methods
export const semesterAPI = {
  getAll: () => api.get('/semesters'),
  getById: (id) => api.get(`/semesters/${id}`),
  create: (data) => api.post('/semesters', data),
  update: (id, data) => api.put(`/semesters/${id}`, data),
  delete: (id) => api.delete(`/semesters/${id}`),
};

// Course API methods
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  regenerateWeeks: (id) => api.post(`/courses/${id}/regenerate-weeks`),
};

// Class schedule (recurring rule) API methods
export const classScheduleAPI = {
  getAll: (params) => api.get('/class-schedules', { params }),
  create: (data) => api.post('/class-schedules', data),
  update: (id, data) => api.put(`/class-schedules/${id}`, data),
  delete: (id) => api.delete(`/class-schedules/${id}`),
};

// Session (single class occurrence) API methods
export const sessionAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`),
};

// Week API methods
export const weekAPI = {
  getAll: (params) => api.get('/weeks', { params }),
  getById: (id) => api.get(`/weeks/${id}`),
  update: (id, data) => api.put(`/weeks/${id}`, data),
  assignSprint: (weekIds, sprint) => api.put('/weeks/assign-sprint', { weekIds, sprint }),
};

// Sprint API methods
export const sprintAPI = {
  getAll: (params) => api.get('/sprints', { params }),
  create: (data) => api.post('/sprints', data),
  update: (id, data) => api.put(`/sprints/${id}`, data),
  delete: (id) => api.delete(`/sprints/${id}`),
};

// Deliverable API methods
export const deliverableAPI = {
  getAll: (params) => api.get('/deliverables', { params }),
  create: (data) => api.post('/deliverables', data),
  update: (id, data) => api.put(`/deliverables/${id}`, data),
  delete: (id) => api.delete(`/deliverables/${id}`),
};
