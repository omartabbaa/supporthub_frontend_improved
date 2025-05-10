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
  getById: (id) => {
    if (!id || id <= 0) {
      console.warn(`INVALID USER ID PROVIDED: ${id}`);
      return Promise.reject(new Error('Invalid user ID'));
    }
    
    console.log(`API CALL TO GET USER WITH ID: ${id}`);
    return apiClient.get(`/api/users/${id}`)
      .then(response => {
        console.log(`USER API RESPONSE FOR ID ${id}:`, response);
        return response;
      })
      .catch(error => {
        console.error(`ERROR FETCHING USER ${id}:`, error);
        throw error;
      });
  },
  getByBusinessId: (businessId) => apiClient.get(`/api/users/business/${businessId}`),
  create: (user) => apiClient.post('/api/users', user),
  update: (id, user) => apiClient.put(`/api/users/${id}`, user),
  delete: (id) => apiClient.delete(`/api/users/${id}`),
};



// Business endpoints
export const businesses = {
  getAll: () => apiClient.get('/api/businesses'),
  getById: (id) => apiClient.get(`/api/businesses/${id}`),
  create: (business) => apiClient.post('/api/businesses', business),
  update: (id, business) => apiClient.put(`/api/businesses/${id}`, business),
  delete: (id) => apiClient.delete(`/api/businesses/${id}`),
  getByBusinessId: (businessId) => apiClient.get(`/api/projects?businessId=${businessId}`),
};



// Department endpoints
export const departments = {
  getAll: () => {
    return apiClient.get('/api/departments');
  },
  getById: (id) => apiClient.get(`/api/departments/${id}`),
  getByBusinessId: (businessId) => apiClient.get(`/api/departments/business/${businessId}`),
  create: (department) => apiClient.post('/api/departments', department),
  update: (id, department) => apiClient.put(`/api/departments/${id}`, department),
  delete: (id) => apiClient.delete(`/api/departments/${id}`),
  getDepartmentsByBusinessId: (businessId) => apiClient.get(`/api/departments/business/${businessId}`),
};



// Project endpoints
export const projects = {
  getAll: () => apiClient.get('/api/projects'),
  getById: (projectId) => apiClient.get(`/api/projects/${projectId}`),
  getByBusinessId: (businessId) => apiClient.get(`/api/projects/business/${businessId}`),
  create: (projectData) => apiClient.post('/api/projects', projectData),
  update: (projectId, projectData) => apiClient.put(`/api/projects/${projectId}`, projectData),
  delete: (projectId) => apiClient.delete(`/api/projects/${projectId}`),
};



// Question endpoints
export const questions = {
  getAll: () => apiClient.get('/api/questions'),
  getById: (id) => apiClient.get(`/api/questions/${id}`),
  getByProjectId: (projectId) => apiClient.get(`/api/questions/project/${projectId}`),
  getCountsByProjectId: (projectId) => apiClient.get(`/api/questions/project/${projectId}/counts`),
  create: (question) => apiClient.post('/api/questions', question),
  update: (id, question) => apiClient.put(`/api/questions/${id}`, question),
  patch: (id, data) => apiClient.patch(`/api/questions/${id}`, data),
  delete: (id) => apiClient.delete(`/api/questions/${id}`),
  toggleStatus: (questionId, userId) => {
    return apiClient.patch(`/api/questions/${questionId}/toggle-status`, { userId });
  },
  getPendingByProjectId: (projectId) => {
    console.log(`Fetching pending questions for project ID: ${projectId}`);
    return apiClient.get(`/api/questions/project/${projectId}/pending`);
  },
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
  getByUserId: (userId) => apiClient.get(`/api/permissions/user/${userId}`),
  create: (permission) => apiClient.post('/api/permissions', permission),
  update: (id, permission) => apiClient.put(`/api/permissions/${id}`, permission),
  patch: (id, permission) => apiClient.patch(`/api/permissions/${id}`, permission),
  delete: (id) => apiClient.delete(`/api/permissions/${id}`),
};



// Agent Questions endpoints
export const agentQuestions = {
  getForUser: (userId, status) => {
    const statusParam = status ? `?status=${status}` : '';
    return apiClient.get(`/api/agent-questions/user/${userId}${statusParam}`);
  },
  getCountsForUser: (userId) => apiClient.get(`/api/agent-questions/count/user/${userId}`),
  getTimingForUser: (userId) => apiClient.get(`/api/agent-questions/timing/user/${userId}`),
  getCountsForBusiness: (businessId) => apiClient.get(`/api/agent-questions/count/business/${businessId}`),
  getTimingForBusiness: (businessId) => apiClient.get(`/api/agent-questions/timing/business/${businessId}`),
  getCountsForProject: (projectId) => apiClient.get(`/api/agent-questions/count/project/${projectId}`),
  getAnsweredCountForProject: (projectId) => apiClient.get(`/api/agent-questions/count/project/${projectId}/answered`),
  getUnansweredCountForProject: (projectId) => apiClient.get(`/api/agent-questions/count/project/${projectId}/unanswered`),
  getByProjectId: (projectId) => apiClient.get(`/api/agent-questions/project/${projectId}`),
  getAnsweredCountForBusiness: (businessId) => apiClient.get(`/api/agent-questions/count/business/${businessId}/answered`),
  getUnansweredCountForBusiness: (businessId) => apiClient.get(`/api/agent-questions/count/business/${businessId}/unanswered`),
};



// Agent Invitations endpoints
export const agentInvitations = {
  create: (invitationData) => apiClient.post('/api/agent-invitations', invitationData),
  getByBusiness: (businessId) => apiClient.get(`/api/agent-invitations/business/${businessId}`),
  cancel: (tokenId) => apiClient.delete(`/api/agent-invitations/${tokenId}`),
  verify: (verificationData) => apiClient.post('/api/agent-invitations/verify', verificationData),
  activate: (activationData) => apiClient.post('/api/agent-invitations/activate', activationData),
  resend: (tokenId) => apiClient.post(`/api/agent-invitations/${tokenId}/resend`),
};



// Add conversation endpoints
export const conversations = {
  getAll: () => apiClient.get('/api/conversations'),
  getById: (conversationId) => apiClient.get(`/api/conversations/${conversationId}`),
  getByBusinessId: (businessId) => apiClient.get(`/api/conversations/business/${businessId}`),
  getByUserId: (userId) => apiClient.get(`/api/conversations/user/${userId}`),
  getAnalytics: (businessId, period = 'all') => apiClient.get(`/api/conversations/analytics/${businessId}?period=${period}`),
  addFeedback: (conversationId, feedback) => apiClient.post(`/api/conversations/${conversationId}/feedback`, { feedback }),
  endConversation: (conversationId) => apiClient.put(`/api/conversations/${conversationId}/end`),
};



// Export default object with all services
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
  agentQuestions,
  agentInvitations,
  conversations,
  setAuthToken,
};


