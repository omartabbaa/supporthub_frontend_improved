import { apiClient } from './ApiService';

// Stripe service for handling payments and subscriptions
export const stripeService = {
  // Get Stripe publishable key
  getConfig: async () => {
    console.log('🔑 Fetching Stripe config...');
    try {
      const response = await apiClient.get('/api/stripe/config');
      console.log('✅ Stripe config received:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching Stripe config:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Create a Stripe customer
  createCustomer: async (businessId) => {
    console.log('👤 Creating Stripe customer for business:', {
      businessId,
      url: `/api/stripe/customers/${businessId}`,
      method: 'POST'
    });

    const maxRetries = 2;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        // First check if customer already exists
        console.log('🔍 Checking if customer already exists...');
        try {
          const checkResponse = await apiClient.get(`/api/stripe/customers/${businessId}`);
          if (checkResponse.data?.customerId) {
            console.log('✅ Customer already exists:', checkResponse.data);
            return checkResponse;
          }
        } catch (checkError) {
          // If 404, customer doesn't exist, which is what we want
          if (checkError.response?.status !== 404) {
            console.warn('⚠️ Error checking customer existence:', checkError);
          }
        }

        // Create new customer
        console.log('🔄 Creating new customer...');
        const response = await apiClient.post(`/api/stripe/customers/${businessId}`);
        
        console.log('✅ Stripe customer created:', {
          customerId: response.data?.customerId,
          status: response.status
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Error creating Stripe customer (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
          businessId,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          headers: error.response?.headers,
          stack: error.stack,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params,
            headers: error.config?.headers
          }
        });

        if (retryCount === maxRetries) {
          // Provide specific error messages based on the error type
          if (error.response?.status === 500) {
            throw new Error('Server error while creating Stripe customer. Please try again later.');
          } else if (error.response?.status === 404) {
            throw new Error('Business not found. Please verify your business ID.');
          } else if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (error.response?.status === 403) {
            throw new Error('You do not have permission to create a Stripe customer.');
          } else {
            throw new Error(error.response?.data?.message || 'Failed to create Stripe customer. Please try again.');
          }
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }
  },

  // Create a Stripe product
  createProduct: (planId) => apiClient.post(`/api/stripe/products/${planId}`),

  // Create a Stripe price
  createPrice: (planId) => apiClient.post(`/api/stripe/prices/${planId}`),

  // Create a Checkout Session
  createCheckoutSession: async (businessId, planId) => {
    console.log('💳 Creating Stripe checkout session:', { 
      businessId, 
      planId,
      url: '/api/stripe/checkout-sessions',
      method: 'POST'
    });
    
    try {
      // First, ensure we have a valid Stripe customer
      console.log('👤 Verifying Stripe customer...');
      let customerResponse;
      try {
        customerResponse = await stripeService.createCustomer(businessId);
        console.log('✅ Customer verification successful:', customerResponse.data);
      } catch (customerError) {
        console.error('⚠️ Customer verification failed:', {
          error: customerError,
          response: customerError.response?.data,
          status: customerError.response?.status
        });
        
        // If customer creation fails, try to proceed with checkout session anyway
        console.log('🔄 Proceeding with checkout session despite customer verification failure...');
      }

      // Create the checkout session
      console.log('🔄 Creating checkout session...');
      const response = await apiClient.post('/api/stripe/checkout-sessions', null, {
        params: { 
          businessId, 
          planId,
          customerId: customerResponse?.data?.customerId // Include customer ID if available
        }
      });
      
      console.log('✅ Checkout session created:', {
        sessionId: response.data?.sessionId,
        url: response.data?.url,
        status: response.status
      });
      
      return response;
    } catch (error) {
      console.error('❌ Error creating checkout session:', {
        businessId,
        planId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers,
        stack: error.stack,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers
        }
      });
      
      // Provide more specific error messages based on the error type
      if (error.response?.status === 500) {
        throw new Error('Server error while creating checkout session. Please check your Stripe configuration and try again.');
      } else if (error.response?.status === 404) {
        throw new Error('Plan or business not found. Please verify your selection.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create a checkout session.');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to create checkout session. Please try again.');
      }
    }
  },

  // Create an embedded Checkout Session
  createEmbeddedCheckoutSession: (businessId, planId) =>
    apiClient.post('/api/stripe/embedded-checkout-sessions', null, {
      params: { businessId, planId }
    }),

  // Create a subscription
  createSubscription: (businessId, planId) =>
    apiClient.post('/api/stripe/subscriptions', null, {
      params: { businessId, planId }
    }),

  // Get session status
  getSessionStatus: async (sessionId) => {
    console.log('🔍 Checking session status:', sessionId);
    try {
      const response = await apiClient.get('/api/stripe/session-status', {
        params: { sessionId }
      });
      console.log('✅ Session status received:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error checking session status:', {
        sessionId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Create a billing portal session
  createBillingPortalSession: async (businessId) => {
    console.log('🔗 Creating billing portal session for business:', businessId);
    try {
      const response = await apiClient.post(`/api/stripe/billing-portal-sessions/${businessId}`);
      console.log('✅ Billing portal session created:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error creating billing portal session:', {
        businessId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Cancel a subscription
  cancelSubscription: (subscriptionId) =>
    apiClient.post(`/api/stripe/subscriptions/${subscriptionId}/cancel`),

  // Update subscription to a new plan
  updateSubscription: (subscriptionId, newPlanId) =>
    apiClient.post(`/api/stripe/subscriptions/${subscriptionId}/update`, null, {
      params: { newPlanId }
    }),

  // Sync Stripe subscription with local database
  syncSubscription: (subscriptionId) =>
    apiClient.post(`/api/stripe/subscriptions/${subscriptionId}/sync`),

  // Update subscription details
  updateSubscriptionDetails: async (subscriptionId, updateData) => {
    console.log('🔄 Starting subscription update:', { 
      subscriptionId, 
      updateData,
      endpoint: `/api/stripe/subscriptions/${subscriptionId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    try {
      // Log the complete request payload
      console.log('📦 Request Payload:', JSON.stringify({
        businessId: updateData.businessId,
        planId: updateData.planId,
        status: updateData.status,
        currentPeriodStart: updateData.currentPeriodStart,
        currentPeriodEnd: updateData.currentPeriodEnd,
        cancelAtPeriodEnd: updateData.cancelAtPeriodEnd,
        subscriptionStartDate: updateData.subscriptionStartDate,
        paymentMethodId: updateData.paymentMethodId,
        prorationBehavior: updateData.prorationBehavior,
        metadata: updateData.metadata
      }, null, 2));

      const response = await apiClient.put(`/api/stripe/subscriptions/${subscriptionId}`, updateData);
      
      // Log the complete response payload
      console.log('📦 Response Payload:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: {
          success: response.data?.success,
          subscriptionId: response.data?.data?.subscriptionId,
          status: response.data?.data?.status,
          planId: response.data?.data?.planId,
          planName: response.data?.data?.planName,
          cancelAtPeriodEnd: response.data?.data?.cancelAtPeriodEnd,
          currentPeriodStart: response.data?.data?.currentPeriodStart,
          currentPeriodEnd: response.data?.data?.currentPeriodEnd,
          metadata: response.data?.data?.metadata
        }
      }, null, 2));
      
      return response;
    } catch (error) {
      // Log the complete error payload
      console.error('❌ Error Payload:', JSON.stringify({
        subscriptionId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        endpoint: `/api/stripe/subscriptions/${subscriptionId}`,
        requestData: updateData
      }, null, 2));
      throw error;
    }
  },

  // Get business subscription info
  getBusinessSubscriptionInfo: async (businessId) => {
    console.log('🔍 Fetching business subscription info:', businessId);
    try {
      // Updated endpoint path to match Spring controller's @RequestMapping
      const response = await apiClient.get(`/api/stripe/businesses/${businessId}/subscription-info`);
      console.log('✅ Business subscription info received:////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching business subscription info:', {
        businessId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        endpoint: `/api/stripe/businesses/${businessId}/subscription-info`
      });

      // Return a default subscription info object instead of throwing
      return {
        data: {
          success: false,
          subscriptionInfo: {
            status: 'unknown',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false
          },
          error: error.response?.data?.message || 'Failed to fetch subscription info'
        }
      };
    }
  }
}; 