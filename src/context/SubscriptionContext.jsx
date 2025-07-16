import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserContext } from './LoginContext';
import { subscriptionPlans, setAuthToken } from '../services/ApiService';

const SubscriptionContext = createContext();

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { token, stateBusinessId, subscriptionPlanId } = useUserContext();
  
  // Current plan state
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Plan limits - only the four we care about
  const [maxConversations, setMaxConversations] = useState(-1);
  const [maxExperts, setMaxExperts] = useState(-1);
  const [maxDepartments, setMaxDepartments] = useState(-1);
  const [maxProjectsPerDepartment, setMaxProjectsPerDepartment] = useState(-1);

  // Log when maxProjectsPerDepartment changes
  useEffect(() => {
    console.log('🔄 [SubscriptionContext] maxProjectsPerDepartment changed to:', maxProjectsPerDepartment);
  }, [maxProjectsPerDepartment]);

  // Fetch plan limits using the same approach as DashboardPage
  const fetchCurrentPlan = useCallback(async () => {
    if (!token || !subscriptionPlanId) {
      console.log('❌ [SubscriptionContext] Missing token or subscriptionPlanId:', { 
        hasToken: !!token, 
        subscriptionPlanId 
      });
      setIsLoading(false);
      setError('Please log in to view subscription information');
      return;
    }

    try {
      console.log('🔄 [SubscriptionContext] Starting subscription data fetch...');
      setIsLoading(true);
      setError(null);
      setAuthToken(token);

      // Get all available plans - same as DashboardPage
      console.log('📊 [SubscriptionContext] Fetching subscription plans...');
      const plansResponse = await subscriptionPlans.getAll(true, 'price')
        .catch(error => {
          console.error('❌ [SubscriptionContext] Error fetching plans:', error);
          throw error;
        });

      const plans = plansResponse.data;
      console.log('📊 [SubscriptionContext] All plans fetched:', plans);

      // Find current plan using subscriptionPlanId from token - same as DashboardPage
      const currentPlan = plans.find(plan => plan.planId === subscriptionPlanId);
      console.log('🔍 [SubscriptionContext] Current plan lookup:', {
        subscriptionPlanId,
        found: !!currentPlan,
        planDetails: currentPlan
      });
      
      if (currentPlan) {
        console.log('✅ [SubscriptionContext] Setting plan limits from backend plan:', {
          maxConversations: currentPlan.maxConversations,
          maxExperts: currentPlan.maxExperts,
          maxDepartments: currentPlan.maxDepartments,
          maxProjectsPerDepartment: currentPlan.maxProjectsPerDepartment
        });
        
        setCurrentPlan(currentPlan);
        setMaxConversations(currentPlan.maxConversations);
        setMaxExperts(currentPlan.maxExperts);
        setMaxDepartments(currentPlan.maxDepartments);
        setMaxProjectsPerDepartment(currentPlan.maxProjectsPerDepartment);
        console.log('✅ [SubscriptionContext] Current plan set successfully:', currentPlan);
      } else {
        console.log('❌ [SubscriptionContext] Current plan not found in available plans');
        setError('Current subscription plan not found. Please contact support.');
        setCurrentPlan(null);
      }
    } catch (error) {
      console.error('❌ [SubscriptionContext] Error fetching subscription data:', error);
      setError('Failed to load subscription information. Please try again later.');
      setCurrentPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, subscriptionPlanId]);

  // Refresh plan data
  const refreshPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await fetchCurrentPlan();
  }, [fetchCurrentPlan]);

  // Initialize subscription data
  useEffect(() => {
    if (token && subscriptionPlanId) {
      setAuthToken(token);
      fetchCurrentPlan();
    } else {
      setIsLoading(false);
    }
  }, [token, subscriptionPlanId, fetchCurrentPlan]);

  const value = {
    // Current plan
    currentPlan,
    isLoading,
    error,
    
    // Plan limits - only the four we care about
    maxConversations,
    maxExperts,
    maxDepartments,
    maxProjectsPerDepartment,
    
    // Methods
    refreshPlan,
    
    // Utility methods
    isUnlimited: (metric) => {
      switch (metric) {
        case 'conversations':
          return maxConversations === -1;
        case 'experts':
          return maxExperts === -1;
        case 'departments':
          return maxDepartments === -1;
        case 'projects':
          return maxProjectsPerDepartment === -1;
        default:
          return false;
      }
    },
    
    getLimit: (metric) => {
      switch (metric) {
        case 'conversations':
          return maxConversations;
        case 'experts':
          return maxExperts;
        case 'departments':
          return maxDepartments;
        case 'projects':
          return maxProjectsPerDepartment;
        default:
          return -1;
      }
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 