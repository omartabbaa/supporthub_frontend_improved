import axios from 'axios';

const BASE_URL = 'http://localhost:8082';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Include credentials (cookies) in cross-origin requests
});

// Function to set auth token for requests
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Request interceptor for handling errors or transforming requests
apiClient.interceptors.request.use(
  config => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(`Error ${error.response.status}:`, error.response.data);
      
      // Handle specific error codes
      switch (error.response.status) {
        case 403:
          console.error('Access forbidden. You might not have permission to perform this action.');
          break;
        case 401:
          console.error('Authentication required. Please login again.');
          // You could trigger a logout here if needed
          break;
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const auth = {
  login: (credentials) => apiClient.post('/authenticate', credentials),
  signup: (data) => apiClient.post('/api/users/signup', data),
};

// User endpoints
export const users = {
  getAll: () => apiClient.get('/api/users'),
};

// Business endpoints
export const businesses = {
  getAll: () => apiClient.get('/api/businesses'),
  getById: (id) => apiClient.get(`/api/businesses/${id}`),
  create: (business) => apiClient.post('/api/businesses', business),
  update: (id, business) => apiClient.put(`/api/businesses/${id}`, business),
  delete: (id) => apiClient.delete(`/api/businesses/${id}`),
};

// Department endpoints
export const departments = {
  getAll: () => apiClient.get('/api/departments'),
  getById: (id) => apiClient.get(`/api/departments/${id}`),
  create: (department) => apiClient.post('/api/departments', department),
  update: (id, department) => apiClient.put(`/api/departments/${id}`, department),
  delete: (id) => apiClient.delete(`/api/departments/${id}`),
};

// Project endpoints
export const projects = {
  getAll: () => apiClient.get('/api/projects'),
  getById: (id) => apiClient.get(`/api/projects/${id}`),
  create: (project) => apiClient.post('/api/projects', project),
  update: (id, project) => apiClient.put(`/api/projects/${id}`, project),
  delete: (id) => apiClient.delete(`/api/projects/${id}`),
};

// Question endpoints
export const questions = {
  getAll: () => apiClient.get('/api/questions'),
  getById: (id) => apiClient.get(`/api/questions/${id}`),
  create: (question) => apiClient.post('/api/questions', question),
  update: (id, question) => apiClient.put(`/api/questions/${id}`, question),
  patch: (id, data) => apiClient.patch(`/api/questions/${id}`, data),
  delete: (id) => apiClient.delete(`/api/questions/${id}`),
};

// Answer endpoints
export const answers = {
  getAll: () => apiClient.get('/api/answers'),
  getById: (id) => apiClient.get(`/api/answers/${id}`),
  create: (answer) => apiClient.post('/api/answers', answer),
  submit: (answer) => apiClient.post('/api/answers/submit', answer),
  delete: (id) => apiClient.delete(`/api/answers/${id}`),
};

// Admin endpoints
export const admins = {
  getAll: () => apiClient.get('/api/admins'),
};

// Permission endpoints
export const permissions = {
  getAll: () => apiClient.get('/api/permissions'),
  getById: (id) => apiClient.get(`/api/permissions/${id}`),
  create: (permission) => apiClient.post('/api/permissions', permission),
  update: (id, permission) => apiClient.put(`/api/permissions/${id}`, permission),
  patch: (id, permission) => apiClient.patch(`/api/permissions/${id}`, permission),
  delete: (id) => apiClient.delete(`/api/permissions/${id}`),
};

export default {
  auth,
  users,
  businesses,
  departments,
  projects,
  questions,
  answers,
  admins,
  permissions,
  setAuthToken,
}; 