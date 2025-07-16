import axios from 'axios';

//https://supporthub-fullstack-project.fly.dev
//http://localhost:8082
//supporthub-backend-widget-and-platform-production-cf49.up.railway.app
const BASE_URL ='http://localhost:8080';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  },
  withCredentials: true // Include credentials (cookies) in cross-origin requests
});

// Function to set auth token for requests
export const setAuthToken = (token) => {
  if (token) {
    console.log('Setting auth token:', token.substring(0, 20) + '...');
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Log the current headers after setting
    console.log('Current headers:', apiClient.defaults.headers.common);
  } else {
    console.log('Removing auth token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Request interceptor for handling errors or transforming requests
apiClient.interceptors.request.use(
  config => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    console.log('Request headers:', config.headers);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  response => {
    // Log successful responses
    if (response.config.url.includes('/upload/document')) {
      console.log(`✅ Upload successful - Status: ${response.status} ${response.statusText} for ${response.config.url}`);
      console.log('Response data:', response.data);
    } else {
      console.log(`✅ Request successful - Status: ${response.status} for ${response.config.url}`);
    }
    return response;
  },
  error => {
    if (error.response) {
      console.error(`❌ Error ${error.response.status}:`, error.response.data);
      
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

// Password Reset endpoints
export const passwordReset = {
  request: (email) => apiClient.post('/api/password-reset/request', { email }),
  verify: (verifyData) => apiClient.post('/api/password-reset/verify', verifyData),
  confirm: (confirmData) => apiClient.post('/api/password-reset/confirm', confirmData),
};

// User endpoints
export const users = {
  getAll: () => apiClient.get('/api/users'),
  getById: (userId) => apiClient.get(`/api/users/${userId}`),
  create: (userData) => apiClient.post('/api/users', userData),
  update: (userId, userData) => apiClient.put(`/api/users/${userId}`, userData),
  delete: (userId) => apiClient.delete(`/api/users/${userId}`),
  getBusinessUsers: (businessId) => apiClient.get(`/api/users/business/${businessId}`),
  getDetails: () => apiClient.get('/api/users/details'),
  getByBusinessId: async (businessId) => {
    try {
      const response = await apiClient.get(`/api/users/business/${businessId}`);
      return response;
    } catch (error) {
      console.error('Error fetching users by business ID:', error);
      throw error;
    }
  },
  getUsersByBusinessIdWithRoleAndUpdateStatus: async (businessId) => {
    try {
      const response = await apiClient.get(`/api/users/business/${businessId}/role-user-no-update`);
      return response;
    } catch (error) {
      console.error('Error fetching users by business ID with role and update status:', error);
      throw error;
    }
  },
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
  getAll: () => apiClient.get('/api/departments'),
  getById: (id) => apiClient.get(`/api/departments/${id}`),
  getByBusinessId: (businessId) => apiClient.get(`/api/departments/business/${businessId}`),
  getByBusiness: (businessId) => apiClient.get(`/api/departments/business/${businessId}`),
  create: (departmentData) => {
    // Ensure businessId is a number if it's coming as a string
    if (departmentData.businessId && typeof departmentData.businessId === 'string') {
      departmentData.businessId = parseInt(departmentData.businessId, 10);
    }
    return apiClient.post('/api/departments', departmentData);
  },
  update: (departmentId, departmentUpdateData) => {
    if (!departmentId) {
      throw new Error('Department ID is required for update');
    }
    
    // Format the update payload according to backend expectations
    const payload = {
      departmentName: departmentUpdateData.departmentName,
      description: departmentUpdateData.description
    };
    
    return apiClient.put(`/api/departments/${departmentId}`, payload);
  },
  delete: (id) => apiClient.delete(`/api/departments/${id}`),
  getProjectsByDepartment: (departmentId) => apiClient.get(`/api/departments/${departmentId}/projects`),
};

// Project endpoints
export const projects = {
  getAll: () => apiClient.get('/api/projects'),
  getById: (projectId) => apiClient.get(`/api/projects/${projectId}`),
  getByBusinessId: (businessId) => apiClient.get(`/api/projects/business/${businessId}`),
  create: async (projectData, imageFile = null) => {
    if (imageFile) {
      // Create project with image upload
      return await projects.createWithImage(projectData, imageFile);
    } else {
      // Regular creation with URL or no image
      return apiClient.post('/api/projects', projectData);
    }
  },
  createWithImage: async (projectData, imageFile) => {
    const formData = new FormData();
    
    // Add project data fields
    formData.append('name', projectData.name);
    formData.append('description', projectData.description);
    formData.append('departmentId', projectData.departmentId);
    if (projectData.businessId) formData.append('businessId', projectData.businessId);
    if (projectData.averageResponseTime) formData.append('averageResponseTime', projectData.averageResponseTime);
    
    // Add image file - using 'file' as the key name that backend expects
    formData.append('file', imageFile);
    
    console.log('Creating project with image upload:', {
      name: projectData.name,
      fileName: imageFile.name,
      fileSize: imageFile.size
    });
    
    return apiClient.post('/api/projects/with-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  uploadProjectImage: async (projectId, imageFile) => {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', imageFile);
    
    console.log('Uploading image for project:', projectId, 'File:', imageFile.name);
    
    return apiClient.post('/api/projects/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  createDefault: (businessId, departmentId) => 
    apiClient.post('/api/projects/create-default', { 
      name: "default topic",
      description: "Default project for general inquiries and topics",
      departmentId: departmentId,
      businessId: businessId,
      averageResponseTime: 24.0
    }),
  update: async (projectId, projectData, imageFile = null) => {
    if (imageFile) {
      // Update project with new image upload
      return await projects.updateWithImage(projectId, projectData, imageFile);
    } else {
      // Regular update with URL or no image change
      return apiClient.put(`/api/projects/${projectId}`, projectData);
    }
  },
  updateWithImage: async (projectId, projectData, imageFile) => {
    const formData = new FormData();
    
    // Add project data fields
    formData.append('name', projectData.name);
    formData.append('description', projectData.description);
    if (projectData.departmentId) formData.append('departmentId', projectData.departmentId);
    if (projectData.businessId) formData.append('businessId', projectData.businessId);
    if (projectData.averageResponseTime) formData.append('averageResponseTime', projectData.averageResponseTime);
    
    // Add image file - using 'file' as the key name that backend expects
    formData.append('file', imageFile);
    
    console.log('Updating project with image upload:', {
      projectId: projectId,
      name: projectData.name,
      fileName: imageFile.name,
      fileSize: imageFile.size
    });
    
    return apiClient.put(`/api/projects/${projectId}/with-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  delete: (projectId) => apiClient.delete(`/api/projects/${projectId}`),
  uploadProjectContext: (projectId, formData, onUploadProgress) => {
    // Add the required fields that your backend expects
    formData.append('projectId', projectId);
    formData.append('documentTitle', formData.get('title') || 'Uploaded Document');
    
    // Add document description if it exists
    const description = formData.get('description');
    if (description) {
      formData.append('documentDescription', description);
    }
    
    formData.append('autoGenerateEmbeddings', 'true');
    
    // Log what we're sending to help with debugging
    console.log('FormData being sent to backend:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File(${value.name})` : value}`);
    }
    
    return apiClient.post('/api/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress
    });
  },
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
  // Replace Q&A with CSV upload
  replaceWithCSV: (projectId, csvFile, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', csvFile); // Backend expects 'file' parameter
    
    return apiClient.post(`/api/projects/${projectId}/qa/replace-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress
    });
  },
};

// Answer endpoints
export const answers = {
  getAll: () => apiClient.get('/api/answers'),
  getById: (id) => apiClient.get(`/api/answers/${id}`),
  getByQuestionId: (questionId) => apiClient.get(`/api/answers/question/${questionId}`),
  create: (answer) => apiClient.post('/api/answers', answer),
  submit: (answer) => apiClient.post('/api/answers/submit', answer),
  delete: (id) => apiClient.delete(`/api/answers/${id}`),
  
  // Cache for answers by question ID to improve performance
  _answerCache: new Map(),
  _cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
  
  // Circuit breaker for failing endpoints
  _circuitBreaker: {
    failureCount: 0,
    maxFailures: 5,
    resetTimeout: 30 * 1000, // 30 seconds
    lastFailureTime: 0,
    isOpen: false
  },
  
  // Check if circuit breaker should be opened or reset
  _checkCircuitBreaker: function() {
    const now = Date.now();
    if (this._circuitBreaker.isOpen && 
        now - this._circuitBreaker.lastFailureTime > this._circuitBreaker.resetTimeout) {
      // Reset circuit breaker
      this._circuitBreaker.isOpen = false;
      this._circuitBreaker.failureCount = 0;
      console.log(`[ApiService] Circuit breaker reset - trying specific endpoint again`);
    }
    return this._circuitBreaker.isOpen;
  },
  
  // Record a failure in the circuit breaker
  _recordFailure: function() {
    this._circuitBreaker.failureCount++;
    this._circuitBreaker.lastFailureTime = Date.now();
    
    if (this._circuitBreaker.failureCount >= this._circuitBreaker.maxFailures) {
      this._circuitBreaker.isOpen = true;
      console.warn(`[ApiService] Circuit breaker opened - specific endpoint failing too often. Using fallback for ${this._circuitBreaker.resetTimeout/1000}s`);
    }
  },
  
  // Enhanced method with caching, circuit breaker, and fallback logic
  getAnswersForQuestion: async function(questionId) {
    const cacheKey = `question_${questionId}`;
    const now = Date.now();
    
    // Check cache first
    if (this._answerCache.has(cacheKey)) {
      const cached = this._answerCache.get(cacheKey);
      if (now - cached.timestamp < this._cacheTimeout) {
        console.log(`[ApiService] Using cached answers for question ${questionId}`);
        return { data: cached.data };
      }
    }
    
    // Check circuit breaker - if open, skip specific endpoint
    const shouldUseSpecificEndpoint = !this._checkCircuitBreaker();
    
    if (shouldUseSpecificEndpoint) {
      try {
        const response = await this.getByQuestionId(questionId);
        
        // Cache the result
        this._answerCache.set(cacheKey, {
          data: response.data,
          timestamp: now
        });
        
        return response;
      } catch (error) {
        this._recordFailure();
        
        // Reduce console noise for server errors
        if (error.response?.status >= 500) {
          console.warn(`[ApiService] Server error for question ${questionId}, using fallback`);
        } else {
          console.log(`[ApiService] Specific endpoint failed for question ${questionId}, using fallback:`, error.message);
        }
      }
    }
    
    // Fallback to getAll and filter
    try {
      const response = await this.getAll();
      
      if (Array.isArray(response.data)) {
        const filteredAnswers = response.data.filter(
          (ans) => ans.questionId === parseInt(questionId, 10)
        );
        
        // Cache the filtered result
        this._answerCache.set(cacheKey, {
          data: filteredAnswers,
          timestamp: now
        });
        
        return { data: filteredAnswers };
      }
      
      throw new Error('Invalid response format from answers API');
    } catch (fallbackError) {
      console.error(`[ApiService] Both specific and fallback endpoints failed for question ${questionId}:`, fallbackError.message);
      
      // Return empty array as last resort
      const emptyResult = { data: [] };
      this._answerCache.set(cacheKey, {
        data: [],
        timestamp: now
      });
      
      return emptyResult;
    }
  },
  
  // Method to invalidate cache for a specific question
  invalidateQuestionCache: function(questionId) {
    const cacheKey = `question_${questionId}`;
    this._answerCache.delete(cacheKey);
    console.log(`[ApiService] Invalidated cache for question ${questionId}`);
  },
  
  // Method to clear all answer cache
  clearCache: function() {
    this._answerCache.clear();
    console.log(`[ApiService] Cleared all answer cache`);
  },
  
  // Debug method to check cache status
  getCacheStats: function() {
    const stats = {
      totalCachedQuestions: this._answerCache.size,
      cacheEntries: []
    };
    
    this._answerCache.forEach((value, key) => {
      const age = Date.now() - value.timestamp;
      stats.cacheEntries.push({
        questionId: key.replace('question_', ''),
        answerCount: value.data.length,
        ageInSeconds: Math.floor(age / 1000),
        isExpired: age > this._cacheTimeout
      });
    });
    
    return stats;
  }
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
  getByProjectId: (projectId) => apiClient.get(`/api/permissions/project/${projectId}`),
  create: (permission) => apiClient.post('/api/permissions', permission),
  update: (id, permission) => apiClient.put(`/api/permissions/${id}`, permission),
  patch: (id, permission) => apiClient.patch(`/api/permissions/${id}`, permission),
  delete: (id) => apiClient.delete(`/api/permissions/${id}`),
  getUsersProjectPermissionsStatus: (projectId) => apiClient.get(`/api/users/project/${projectId}/permissions-status`),
  createPermission: (permissionData) => apiClient.post('/api/permissions', permissionData),
  deletePermission: (permissionId) => apiClient.delete(`/api/permissions/${permissionId}`),
};

// Agent Questions endpoints
export const agentQuestions = {
  // NEW ENRICHED ENDPOINT - Replaces 30+ API calls with 1 optimized call
  getEnrichedForUser: (userId, options = {}) => {
    const { 
      page = 0, 
      size = 10, 
      status = '', 
      sort = 'createdAt,desc',
      includeAnswers = true,
      includeAnswerDetails = false
    } = options;
    
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (status) params.append('status', status);
    params.append('sort', sort);
    params.append('includeAnswers', includeAnswers);
    params.append('includeAnswerDetails', includeAnswerDetails);
    
    return apiClient.get(`/api/agent-questions/user/${userId}/enriched?${params}`);
  },
  
  // Legacy method for backward compatibility
  getForUser: (userId, status) => {
    let url = `/api/agent-questions/user/${userId}`;
    if (status) url += `?status=${status}`;
    return apiClient.get(url);
  },
  getAgentAnalytics: async (userId, businessId) => {
    try {
      console.log('🔗 Fetching agent analytics for user:', userId, 'business:', businessId);
      
      const [countsResponse, timingResponse] = await Promise.all([
        apiClient.get(`/api/agent-questions/count/user/${userId}`),
        apiClient.get(`/api/agent-questions/timing/user/${userId}`)
      ]);
      
      const analytics = {
        counts: countsResponse.data,
        timing: timingResponse.data
      };
      
      console.log('🔗 Combined agent analytics response:', analytics);
      return { data: analytics };
    } catch (error) {
      console.error('🔗 Agent analytics request failed:', error);
      return {
        data: {
          counts: {
            totalQuestions: 0,
            totalAnswered: 0,
            unansweredQuestions: 0,
            projectCount: 0
          },
          timing: {
            totalAnsweredCount: 0,
            averageResponseTimeMinutes: 0,
            fastestResponseTimeMinutes: 0,
            slowestResponseTimeMinutes: 0,
            details: []
          }
        }
      };
    }
  },
  getBusinessAnalytics: async (businessId) => {
    try {
      console.log('🔗 Fetching business analytics for:', businessId);
      
      const [countsResponse, timingResponse] = await Promise.all([
        apiClient.get(`/api/agent-questions/count/business/${businessId}`),
        apiClient.get(`/api/agent-questions/timing/business/${businessId}`)
      ]);
      
      const analytics = {
        counts: countsResponse.data,
        timing: timingResponse.data
      };
      
      console.log('🔗 Business analytics response:', analytics);
      return { data: analytics };
    } catch (error) {
      console.error('🔗 Business analytics request failed:', error);
      return {
        data: {
          counts: {
            totalQuestions: 0,
            unansweredQuestions: 0,
            projectCount: 0
          },
          timing: {
            averageResponseTimeMinutes: 0,
            fastestResponseTimeMinutes: 0,
            slowestResponseTimeMinutes: 0,
            dailyVolume: {}
          }
        }
      };
    }
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
  // ✅ NEW: Future optimized backend endpoint (single call instead of 2)
  // This method will call the new combined backend endpoint once it's implemented
  getCombinedAnalytics: async (userId, businessId) => {
    try {
      console.log('🚀 BACKEND-OPTIMIZED: Calling combined analytics endpoint for user:', userId);
      const startTime = performance.now();
      
      // Single API call to new combined backend endpoint
      const response = await apiClient.get(`/api/agent-questions/user/${userId}/analytics`, {
        params: businessId ? { businessId } : {}
      });
      
      const endTime = performance.now();
      console.log(`🚀 BACKEND-OPTIMIZED: Combined analytics loaded in ${Math.round(endTime - startTime)}ms (single backend call)`);
      
      // Response maintains same structure as existing getAgentAnalytics for compatibility
      const analytics = {
        counts: response.data.counts,
        timing: response.data.timing,
        generatedAt: response.data.generatedAt
      };
      
      console.log('🚀 BACKEND-OPTIMIZED: Combined analytics response:', analytics);
      return { data: analytics };
    } catch (error) {
      console.error('❌ BACKEND-OPTIMIZED: Combined analytics request failed:', error);
      
      // Auto-fallback to existing method if new endpoint not available yet
      console.log('🔄 FALLBACK: Using existing dual API calls...');
      
      // Call the existing method that makes 2 separate API calls
      const [countsResponse, timingResponse] = await Promise.all([
        apiClient.get(`/api/agent-questions/count/user/${userId}`),
        apiClient.get(`/api/agent-questions/timing/user/${userId}`)
      ]);
      
      return {
        data: {
          counts: countsResponse.data,
          timing: timingResponse.data
        }
      };
    }
  },
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

// Conversations API
export const conversations = {
  create: (conversationData) => apiClient.post('/api/conversations', conversationData),
  getByBusinessId: (businessId) => apiClient.get(`/api/conversations/business/${businessId}`),
  countByBusinessId: (businessId) => apiClient.get(`/api/conversations/count/business/${businessId}`),
  getConversation: (conversationId) => {
    console.log('🔗 API Service: getConversation called with ID:', conversationId);
    const url = `/api/conversations/${conversationId}`;
    console.log('🔗 Making request to URL:', url);
    
    return apiClient.get(url)
      .then(response => {
        console.log('🔗 getConversation API response received:', response.data);
        return response.data; // Return the actual data, not the full response
      })
      .catch(error => {
        console.error('🔗 getConversation API request failed:', error);
        throw error;
      });
  },
  addMessage: (conversationId, messageData) => apiClient.post(`/api/conversations/${conversationId}/messages`, messageData),
  endConversation: (conversationId) => apiClient.post(`/api/conversations/${conversationId}/end`),
  submitFeedback: (conversationId, feedbackData) => apiClient.post(`/api/conversations/${conversationId}/feedback`, feedbackData),
  updateConversation: (conversationId, updateData) => apiClient.put(`/api/conversations/${conversationId}/route-message`, updateData),
  collectContactInfo: (conversationId, request) => apiClient.post(`/api/conversations/${conversationId}/collect-contact-info`, request),
  getAlternatingMessages: (conversationId, limit, offset) => {
    console.log('🔗 API Service: getAlternatingMessages called with:', { conversationId, limit, offset });
    
    const params = new URLSearchParams();
    if (limit !== undefined && limit !== null) params.append('limit', limit);
    if (offset !== undefined && offset !== null) params.append('offset', offset);
    
    const queryString = params.toString();
    const url = `/api/conversations/${conversationId}/messages/alternating${queryString ? '?' + queryString : ''}`;
    
    console.log('🔗 Making request to URL:', url);
    
    return apiClient.get(url)
      .then(response => {
        console.log('🔗 API response received:', response.data);
        return response.data; // Return the actual data, not the full response
      })
      .catch(error => {
        console.error('🔗 API request failed:', error);
        throw error;
      });
  },
};

// Add document upload endpoints
export const documents = {
  upload: (formData, onUploadProgress) =>
    apiClient.post('/api/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress
    }),
  uploadFiles: async (formData, onUploadProgress) => {
    // The backend expects: title, description, userId, projectId, files[]
    // Ensure formData is constructed with these keys.
    // 'files' should be the key for the array of files.
    try {
      const response = await apiClient.post('/documents/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress, // Axios will call this with progress events
      });
      return response.data;
    } catch (error) {
      console.error("Error in uploadFiles service:", error.response || error);
      throw error.response?.data || error;
    }
  },
  addKnowledge: async (knowledgeData) => {
    // This one seems to be for simpler text/file combo without detailed progress
    // We are now favoring uploadFiles for the widget.
    try {
      const response = await apiClient.post('/documents/add-knowledge', knowledgeData, {
        headers: {
          'Content-Type': 'multipart/form-data', // If it also handles files
        },
      });
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },
};

// Add API key management endpoints
export const apiKeys = {
  generate: (businessId) => apiClient.post('/api/admin/api-keys/generate', { businessId: Number(businessId) }),
  getByBusiness: (businessId) => apiClient.get(`/api/admin/api-keys/business/${businessId}`),
  deactivate: (keyValue) => apiClient.post(`/api/admin/api-keys/deactivate/${keyValue}`),
};

// Add new API service for Widget Configurations
export const widgetConfigurationsApi = {
  getByBusinessId: (businessId) => {
    return apiClient.get(`/api/widget-configurations/business/${businessId}`);
  },
  createConfiguration: (createRequest) => {
    // createRequest should match CreateWidgetConfigurationRequest DTO
    // It includes businessId and all other config fields
    return apiClient.post('/api/widget-configurations', createRequest);
  },
  updateConfiguration: (configId, updateRequest) => {
    // updateRequest should match UpdateWidgetConfigurationRequest DTO
    // It includes all config fields, configId is in the path
    return apiClient.put(`/api/widget-configurations/${configId}`, updateRequest);
  },
  // deleteConfiguration: (configId) => { // If you need delete functionality
  //   return apiClient.delete(`/api/widget-configurations/${configId}`);
  // }
};

// Add new API service for AI Personalities
export const aiPersonalitiesApi = {
  getByBusinessId: (businessId) => {
    return apiClient.get(`/api/ai-personalities/business/${businessId}`);
  },
  createPersonality: (createRequest) => {
    // createRequest should match CreateAiPersonalityRequest DTO
    // It includes businessId and all other personality fields
    return apiClient.post('/api/ai-personalities', createRequest);
  },
  updatePersonalityByBusinessId: (businessId, updateRequest) => {
    // updateRequest should match UpdateAiPersonalityRequest DTO
    return apiClient.put(`/api/ai-personalities/business/${businessId}`, updateRequest);
  },
  deletePersonalityByBusinessId: (businessId) => {
    return apiClient.delete(`/api/ai-personalities/business/${businessId}`);
  },
  // Optional: getById if you need to fetch by personality's own ID
  // getById: (id) => {
  //   return apiClient.get(`/api/ai-personalities/${id}`);
  // }
};

// Add subscription plans endpoints
export const subscriptionPlans = {
  getAll: async (active = true, sort = 'price') => {
    console.log('📊 Fetching subscription plans:', { active, sort });
    try {
      const response = await apiClient.get('/api/subscription-plans', {
        params: { active, sort }
      });
      console.log('✅ Subscription plans fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching subscription plans:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          params: error.config?.params,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  },
  getCurrentPlan: (businessId) => apiClient.get(`/api/subscription-plans/business/${businessId}/current`),
  updatePlan: (businessId, planId) => apiClient.put(`/api/subscription-plans/business/${businessId}`, { planId }),
  getById: (id) => apiClient.get(`/api/subscription-plans/${id}`),
  getByName: (name) => apiClient.get(`/api/subscription-plans/name/${name}`),
  create: (planData) => apiClient.post('/api/subscription-plans', planData),
  update: (id, planData) => apiClient.put(`/api/subscription-plans/${id}`, planData),
  deactivate: (id) => apiClient.put(`/api/subscription-plans/${id}/deactivate`),
  activate: (id) => apiClient.put(`/api/subscription-plans/${id}/activate`)
};

// Add subscription usage endpoints
export const subscriptionUsage = {
  getByBusinessId: (businessId) => apiClient.get(`/api/subscription-usage/business/${businessId}`),
  upsertBusinessUsageMetrics: (businessId) => apiClient.post(`/api/subscription-usage/business/${businessId}/upsert`),
  updateUsage: (businessId, usageData) => apiClient.put(`/api/subscription-usage/business/${businessId}`, usageData),
  calculateBusinessMetrics: (businessId) => apiClient.get(`/api/subscription-usage/business/${businessId}/calculate`)
};

export const createSubscriptionInvoice = async (invoiceData) => {
  try {
    console.log('📄 Creating invoice with data:', invoiceData);
    const response = await apiClient.post('/api/subscription-invoices', invoiceData);
    console.log('✅ Invoice created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    throw error;
  }
};

// Add new API service for Permission Widget Configuration
export const permissionWidgetConfigurationApi = {
  getById: (id) => {
    return apiClient.get(`/api/permission-widget-configurations/${id}`);
  },
  getAll: () => {
    return apiClient.get('/api/permission-widget-configurations');
  },
  getByUserId: (userId) => {
    return apiClient.get(`/api/permission-widget-configurations/user/${userId}`);
  },
  getByBusinessId: (businessId) => {
    return apiClient.get(`/api/permission-widget-configurations/business/${businessId}`);
  },
  getByUserIdAndBusinessId: (userId, businessId) => {
    return apiClient.get(`/api/permission-widget-configurations/user/${userId}/business/${businessId}`);
  },
  getByCanAccess: (canAccess) => {
    return apiClient.get(`/api/permission-widget-configurations/access/${canAccess}`);
  },
  getByBusinessIdAndCanAccess: (businessId, canAccess) => {
    return apiClient.get(`/api/permission-widget-configurations/business/${businessId}/access/${canAccess}`);
  },
  checkUserAccessForBusiness: (userId, businessId) => {
    return apiClient.get(`/api/permission-widget-configurations/check-access/user/${userId}/business/${businessId}`);
  },
  create: (inputDTO) => {
    return apiClient.post('/api/permission-widget-configurations', inputDTO);
  },
  update: (id, inputDTO) => {
    return apiClient.put(`/api/permission-widget-configurations/${id}`, inputDTO);
  },
  deleteById: (id) => {
    return apiClient.delete(`/api/permission-widget-configurations/${id}`);
  },
  toggleAccess: (userId, businessId) => {
    return apiClient.post(`/api/permission-widget-configurations/toggle-access/user/${userId}/business/${businessId}`);
  }
};

// Export default object with all services
export default {
  auth,
  passwordReset,
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
  documents,
  apiKeys,
  widgetConfigurationsApi,
  aiPersonalitiesApi,
  subscriptionPlans,
  subscriptionUsage,
  permissionWidgetConfigurationApi,
  setAuthToken,
  createSubscriptionInvoice,
};