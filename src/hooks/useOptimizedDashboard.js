import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscriptionPlans, subscriptionUsage, agentQuestions, departments, users, conversations } from '../services/ApiService';
import { stripeService } from '../services/StripeService';

// Multi-level caching system
const CACHE_KEYS = {
  SUBSCRIPTION: 'dashboard_subscription',
  USAGE: 'dashboard_usage', 
  ANALYTICS: 'dashboard_analytics',
  PLANS: 'dashboard_plans'
};

const CACHE_DURATIONS = {
  SUBSCRIPTION: 10 * 60 * 1000, // 10 minutes (rarely changes)
  USAGE: 2 * 60 * 1000,         // 2 minutes (moderate changes) 
  ANALYTICS: 30 * 1000,         // 30 seconds (frequent changes)
  PLANS: 30 * 60 * 1000         // 30 minutes (very stable)
};

// Memory cache for instant access
const memoryCache = new Map();

// Cache utilities
const getCacheKey = (type, businessId) => `${CACHE_KEYS[type]}_${businessId}`;

const getCachedData = (type, businessId) => {
  const cacheKey = getCacheKey(type, businessId);
  
  // 1. Check memory cache first (instant)
  const memoryData = memoryCache.get(cacheKey);
  if (memoryData && Date.now() - memoryData.timestamp < CACHE_DURATIONS[type]) {
    console.log(`📦 Using memory cache for ${type}`);
    return memoryData.data;
  }
  
  // 2. Check session storage (fast)
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATIONS[type]) {
        console.log(`📦 Using session cache for ${type}`);
        // Update memory cache
        memoryCache.set(cacheKey, { data, timestamp });
        return data;
      }
    }
  } catch (error) {
    console.warn(`Cache read error for ${type}:`, error);
  }
  
  return null;
};

const setCachedData = (type, businessId, data) => {
  const cacheKey = getCacheKey(type, businessId);
  const cacheItem = { data, timestamp: Date.now() };
  
  // Set memory cache
  memoryCache.set(cacheKey, cacheItem);
  
  // Set session storage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn(`Cache write error for ${type}:`, error);
  }
};

// Performance monitoring
const logPerformance = (operation, startTime, endTime) => {
  const duration = Math.round(endTime - startTime);
  console.log(`⏱️ PERFORMANCE: ${operation} took ${duration}ms`);
  return duration;
};

// Optimized dashboard hook
export const useOptimizedDashboard = (stateBusinessId, token, subscriptionPlanId) => {
  const [dashboardData, setDashboardData] = useState({
    subscription: null,
    usage: null,
    analytics: null,
    plans: null
  });
  
  const [loading, setLoading] = useState({
    subscription: true,
    usage: true,
    analytics: true,
    plans: true,
    overall: true
  });
  
  const [errors, setErrors] = useState({});
  const [lastFetch, setLastFetch] = useState(null);

  // QUICK WIN 1: Parallel API calls with caching
  const fetchSubscriptionData = useCallback(async () => {
    if (!token || !subscriptionPlanId) return null;
    
    // Check cache first
    const cached = getCachedData('SUBSCRIPTION', stateBusinessId);
    if (cached) {
      setDashboardData(prev => ({ ...prev, subscription: cached }));
      setLoading(prev => ({ ...prev, subscription: false }));
      return cached;
    }
    
    try {
      const startTime = performance.now();
      const response = await subscriptionPlans.getAll(true, 'price');
      const plans = response.data;
      const currentPlan = plans.find(plan => plan.planId === subscriptionPlanId);
      
      const subscriptionData = {
        allPlans: plans,
        currentPlan,
        planId: subscriptionPlanId
      };
      
      const endTime = performance.now();
      logPerformance('Subscription fetch', startTime, endTime);
      
      setCachedData('SUBSCRIPTION', stateBusinessId, subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('❌ Subscription fetch error:', error);
      setErrors(prev => ({ ...prev, subscription: error.message }));
      return null;
    }
  }, [token, subscriptionPlanId, stateBusinessId]);

  const fetchUsageData = useCallback(async () => {
    if (!token || !stateBusinessId) return null;
    
    // Check cache first
    const cached = getCachedData('USAGE', stateBusinessId);
    if (cached) {
      setDashboardData(prev => ({ ...prev, usage: cached }));
      setLoading(prev => ({ ...prev, usage: false }));
      return cached;
    }
    
    try {
      const startTime = performance.now();
      
      // OPTIMIZED: Parallel API calls instead of sequential
      const [
        businessAnalytics,
        departmentsData, 
        usersData,
        conversationsCountResponse,
        subscriptionInfo
      ] = await Promise.all([
        agentQuestions.getBusinessAnalytics(stateBusinessId).catch(() => ({ data: { counts: {}, timing: {} } })),
        departments.getByBusinessId(stateBusinessId).catch(() => ({ data: [] })),
        users.getByBusinessId(stateBusinessId).catch(() => ({ data: [] })),
        conversations.countByBusinessId(stateBusinessId).catch(() => ({ data: { count: 0 } })),
        stripeService.getBusinessSubscriptionInfo(stateBusinessId).catch(() => ({ data: { subscriptions: [] } }))
      ]);
      
      const usageData = {
        conversationsCount: conversationsCountResponse.data?.count || 0,
        expertsCount: usersData.data?.filter(user => user.role === 'AGENT')?.length || 0,
        departmentsCount: departmentsData.data?.length || 0,
        projectsCount: businessAnalytics.data.counts?.projectCount || 0,
        totalQuestions: businessAnalytics.data.counts?.totalQuestions || 0,
        unansweredQuestions: businessAnalytics.data.counts?.unansweredQuestions || 0,
        averageResponseTime: businessAnalytics.data.timing?.averageResponseTimeMinutes || 0,
        subscriptionInfo: subscriptionInfo.data?.data?.subscriptions?.[0] || null
      };
      
      const endTime = performance.now();
      logPerformance('Usage data fetch (parallel)', startTime, endTime);
      
      setCachedData('USAGE', stateBusinessId, usageData);
      return usageData;
    } catch (error) {
      console.error('❌ Usage fetch error:', error);
      setErrors(prev => ({ ...prev, usage: error.message }));
      return null;
    }
  }, [token, stateBusinessId]);

  // QUICK WIN 2: Progressive loading with instant cache response
  const loadDashboard = useCallback(async () => {
    console.log('🚀 OPTIMIZED: Starting dashboard load with caching...');
    const overallStartTime = performance.now();
    
    setLoading(prev => ({ ...prev, overall: true }));
    
    try {
      // Load cached data instantly first
      const cachedSubscription = getCachedData('SUBSCRIPTION', stateBusinessId);
      const cachedUsage = getCachedData('USAGE', stateBusinessId);
      
      if (cachedSubscription || cachedUsage) {
        console.log('📦 Instant cache load - showing cached data immediately');
        setDashboardData(prev => ({
          ...prev,
          subscription: cachedSubscription || prev.subscription,
          usage: cachedUsage || prev.usage
        }));
        setLoading(prev => ({
          ...prev,
          subscription: !cachedSubscription,
          usage: !cachedUsage,
          overall: false
        }));
      }
      
      // Then fetch fresh data in parallel (background refresh)
      const [subscriptionData, usageData] = await Promise.all([
        fetchSubscriptionData(),
        fetchUsageData()
      ]);
      
      // Update with fresh data
      setDashboardData(prev => ({
        ...prev,
        subscription: subscriptionData || prev.subscription,
        usage: usageData || prev.usage
      }));
      
      setLoading({
        subscription: false,
        usage: false,
        analytics: false,
        plans: false,
        overall: false
      });
      
      setLastFetch(Date.now());
      
      const overallEndTime = performance.now();
      logPerformance('Complete dashboard load', overallStartTime, overallEndTime);
      
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      setErrors(prev => ({ ...prev, overall: error.message }));
      setLoading(prev => ({ ...prev, overall: false }));
    }
  }, [stateBusinessId, fetchSubscriptionData, fetchUsageData]);

  // QUICK WIN 3: Smart memoization with reduced dependencies
  const optimizedMetrics = useMemo(() => {
    if (!dashboardData.usage || !dashboardData.subscription?.currentPlan) {
      return { utilizationPercentage: 0, limits: null, usage: null };
    }
    
    const { usage } = dashboardData;
    const plan = dashboardData.subscription.currentPlan;
    
    // Simple utilization calculation
    const conversationUtil = plan.maxConversations === -1 ? 0 : 
      ((usage.conversationsCount || 0) / plan.maxConversations) * 100;
    const expertUtil = plan.maxExperts === -1 ? 0 : 
      ((usage.expertsCount || 0) / plan.maxExperts) * 100;
    const deptUtil = plan.maxDepartments === -1 ? 0 : 
      ((usage.departmentsCount || 0) / plan.maxDepartments) * 100;
    
    return {
      utilizationPercentage: Math.round((conversationUtil + expertUtil + deptUtil) / 3),
      limits: {
        conversations: plan.maxConversations,
        experts: plan.maxExperts,
        departments: plan.maxDepartments,
        projects: plan.maxProjectsPerDepartment
      },
      usage: {
        conversations: usage.conversationsCount,
        experts: usage.expertsCount,
        departments: usage.departmentsCount,
        projects: usage.projectsCount
      }
    };
  }, [dashboardData.subscription?.currentPlan?.planId, dashboardData.usage?.conversationsCount]); // Minimal deps

  // QUICK WIN 4: Cache invalidation and refresh
  const refreshData = useCallback(async (force = false) => {
    if (force) {
      // Clear caches
      const subscriptionKey = getCacheKey('SUBSCRIPTION', stateBusinessId);
      const usageKey = getCacheKey('USAGE', stateBusinessId);
      
      memoryCache.delete(subscriptionKey);
      memoryCache.delete(usageKey);
      sessionStorage.removeItem(subscriptionKey);
      sessionStorage.removeItem(usageKey);
    }
    
    await loadDashboard();
  }, [loadDashboard, stateBusinessId]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (token && stateBusinessId) {
      loadDashboard();
    }
  }, [token, stateBusinessId, loadDashboard]);

  return {
    data: dashboardData,
    loading,
    errors,
    metrics: optimizedMetrics,
    lastFetch,
    refreshData,
    
    // Performance helpers
    isCached: (type) => !!getCachedData(type, stateBusinessId),
    clearCache: () => {
      memoryCache.clear();
      Object.values(CACHE_KEYS).forEach(key => {
        sessionStorage.removeItem(`${key}_${stateBusinessId}`);
      });
    }
  };
}; 