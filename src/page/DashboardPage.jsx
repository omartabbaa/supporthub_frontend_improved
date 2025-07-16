import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserContext } from '../context/LoginContext';
import './DashboardPage.css';
import { subscriptionPlans, subscriptionUsage, agentQuestions, departments, users, conversations, setAuthToken } from '../services/ApiService';
import { stripeService } from '../services/StripeService';
import { loadStripe } from '@stripe/stripe-js';
import { Link } from 'react-router-dom';
import InvoiceComponent from '../Components/InvoiceComponent';
import ConversationsCounterPage from './ConversationsCounterPage';

// Initialize Stripe
let stripePromise;
const initializeStripe = async () => {
  try {
    console.log('🔄 Initializing Stripe...');
    const { data } = await stripeService.getConfig();
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log('🌍 Environment:', { 
      mode: process.env.NODE_ENV,
      isDevelopment,
      protocol: window.location.protocol
    });

    // Only show warning in development
    if (isDevelopment && window.location.protocol === 'http:') {
      console.warn('⚠️ Running Stripe in development mode over HTTP. In production, use HTTPS.');
    }

    stripePromise = loadStripe(data.publishableKey);
    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Stripe:', {
      error,
      response: error.response?.data,
      status: error.response?.status,
      message: error.message
    });
    // Don't throw the error, just log it and let the app continue
    // The user will see an error when they try to use Stripe features
  }
};

// Subscription Plans Modal Component
const SubscriptionPlansModal = ({ 
  isOpen, 
  onClose, 
  allPlans, 
  currentPlan, 
  onPlanSelect, 
  isUpdatingPlan,
  updateError,
  onErrorDismiss
}) => {
  if (!isOpen) return null;

  const formatBillingInterval = (interval) => {
    switch (interval) {
      case 'MONTHLY':
        return 'month';
      case 'YEARLY':
        return 'year';
      case 'QUARTERLY':
        return 'quarter';
      default:
        return interval.toLowerCase();
    }
  };

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
        <div className="modal-header">
          <h2>Choose Your Plan</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {updateError && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{updateError}</span>
              <button className="dismiss-error" onClick={onErrorDismiss}>×</button>
            </div>
          )}

          <div className="plans-list">
            {allPlans.map((plan) => (
              <div key={plan.planId} className="plan-item">
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price-amount">${plan.price}</span>
                    <span className="price-interval">per {formatBillingInterval(plan.billingInterval)}</span>
                  </div>
                </div>
                <p className="plan-description">{plan.description}</p>
                
                <div className="plan-details">
                  <div className="detail-row">
                    <span>Expert Seats:</span>
                    <span>{plan.maxExperts === -1 ? 'Unlimited' : plan.maxExperts}</span>
                  </div>
                  <div className="detail-row">
                    <span>Departments:</span>
                    <span>{plan.maxDepartments === -1 ? 'Unlimited' : plan.maxDepartments}</span>
                  </div>
                  <div className="detail-row">
                    <span>Projects per Department:</span>
                    <span>{plan.maxProjectsPerDepartment === -1 ? 'Unlimited' : plan.maxProjectsPerDepartment}</span>
                  </div>
                  <div className="detail-row">
                    <span>Conversations:</span>
                    <span>{plan.maxConversations === -1 ? 'Unlimited' : plan.maxConversations}</span>
                  </div>
                </div>

                <button 
                  className={`select-plan-button ${currentPlan?.planId === plan.planId ? 'current' : ''}`}
                  onClick={() => onPlanSelect(plan)}
                  disabled={isUpdatingPlan || !plan.isActive || currentPlan?.planId === plan.planId}
                >
                  {currentPlan?.planId === plan.planId ? 'Current Plan' : `Select Plan - $${plan.price}/${formatBillingInterval(plan.billingInterval)}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Move plan mapping outside component and add price mapping
const PLAN_AMOUNT_MAPPING = {
  '9800': { name: 'Starter Plan', planId: 1 },
  '20000': { name: 'Growth Plan', planId: 2 },
  '300000': { name: 'Enterprise Plan', planId: 3 },
  '150000': { name: 'Scale Plan', planId: 4 }
};

// Main Dashboard Component
const DashboardPage = () => {
  const { role, isLogin, businessName, userId, stateBusinessId, token, subscriptionPlanId } = useUserContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allPlans, setAllPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(null);

  // Memoize the plan details based on amount
  const currentPlanDetails = useMemo(() => {
    if (!subscriptionInfo?.plan?.amount) {
      return {
        name: currentPlan?.name,
        planId: currentPlan?.planId,
        amount: currentPlan?.price * 100 // Convert to cents
      };
    }
    
    const amount = subscriptionInfo.plan.amount.toString();
    const planDetails = PLAN_AMOUNT_MAPPING[amount] || {
      name: 'Custom Plan',
      planId: currentPlan?.planId
    };

    return {
      ...planDetails,
      amount: subscriptionInfo.plan.amount
    };
  }, [subscriptionInfo?.plan?.amount, currentPlan]);

  // Memoize the active plan limits from the actual subscription
  const activePlanLimits = useMemo(() => {
    // If we have subscription info, get the plan ID and find the matching plan details
    if (subscriptionInfo?.plan?.amount && allPlans.length > 0) {
      const amount = subscriptionInfo.plan.amount.toString();
      const mappedPlan = PLAN_AMOUNT_MAPPING[amount];
      
      if (mappedPlan) {
        // Find the actual plan details from allPlans using the mapped planId
        const actualPlan = allPlans.find(plan => plan.planId === mappedPlan.planId);
        if (actualPlan) {
          console.log('📊 Using actual subscription plan limits:', actualPlan.name, actualPlan);
          return actualPlan;
        }
      }
    }
    
    // Fallback to currentPlan if subscription info isn't available or plan not found
    console.log('📊 Falling back to currentPlan limits:', currentPlan?.name);
    return currentPlan;
  }, [subscriptionInfo?.plan?.amount, allPlans, currentPlan]);

  // Calculate utilization percentage based on active plan limits
  const calculatedUtilizationPercentage = useMemo(() => {
    if (!activePlanLimits || !usageData) return 0;
    
    const conversationUtilization = activePlanLimits.maxConversations === -1 ? 0 : 
      ((usageData.conversationsCount || 0) / activePlanLimits.maxConversations) * 100;
    const departmentUtilization = activePlanLimits.maxDepartments === -1 ? 0 : 
      ((usageData.departmentsCount || 0) / activePlanLimits.maxDepartments) * 100;
    const expertUtilization = activePlanLimits.maxExperts === -1 ? 0 : 
      ((usageData.expertsCount || 0) / activePlanLimits.maxExperts) * 100;
    
    const avgUtilization = (conversationUtilization + departmentUtilization + expertUtilization) / 3;
    console.log('🧮 Active plan utilization:', { 
      planName: activePlanLimits.name,
      conversationUtilization, 
      departmentUtilization, 
      expertUtilization, 
      avgUtilization 
    });
    
    return Math.max(0, Math.min(100, avgUtilization || 0));
  }, [activePlanLimits, usageData]);

  // Initialize Stripe when component mounts
  useEffect(() => {
    initializeStripe();
  }, []);

  // Set auth token when component mounts or token changes
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  // Real activity data state
  const [recentActivity, setRecentActivity] = useState([
    { action: 'Widget deployed', detail: 'Customer Support Widget', time: '2 hours ago' },
    { action: 'Question answered', detail: 'Product pricing inquiry', time: '4 hours ago' },
    { action: 'Analytics report', detail: 'Weekly performance summary', time: '1 day ago' },
    { action: 'Widget updated', detail: 'FAQ Widget styling', time: '2 days ago' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch business usage analytics using subscription usage endpoints
  useEffect(() => {
    const fetchUsageAnalytics = async () => {
      console.log('🔍 fetchUsageAnalytics called with:', { token: !!token, stateBusinessId, currentPlan });
      
      if (!token || !stateBusinessId) {
        console.log('❌ Missing token or stateBusinessId, skipping analytics fetch');
        setAnalyticsLoading(false);
        return;
      }

      try {
        console.log('🔄 Starting analytics fetch, setting loading to true');
        setAnalyticsLoading(true);
        
        // Only attempt subscription usage endpoints if there's an active subscription plan
        if (currentPlan && currentPlan.isActive) {
          console.log('✅ Active subscription plan found:', currentPlan.name, 'attempting subscription usage endpoint');
          try {
            // First, upsert the business usage metrics to ensure they're up to date
            console.log('📤 Calling upsertBusinessUsageMetrics for businessId:', stateBusinessId);
            await subscriptionUsage.upsertBusinessUsageMetrics(stateBusinessId);
            console.log('✅ Upsert successful');
            
            // Then call the calculate endpoint to get real-time calculated metrics
            console.log('🧮 Calling calculateBusinessMetrics for businessId:', stateBusinessId);
            const calculateResponse = await subscriptionUsage.calculateBusinessMetrics(stateBusinessId);
            console.log('📊 Calculate response:', calculateResponse);
            const calculatedMetrics = calculateResponse.data;
            console.log('📈 Calculated metrics data:', calculatedMetrics);
            
            // Also get business analytics for additional timing metrics and correct conversation count
            console.log('📥 Fetching business analytics and conversation count');
            const [businessAnalytics, conversationsCountResponse] = await Promise.all([
              agentQuestions.getBusinessAnalytics(stateBusinessId).catch(() => ({ data: { counts: {}, timing: {} } })),
              conversations.countByBusinessId(stateBusinessId).catch(() => ({ data: { count: 0 } }))
            ]);
            console.log('📊 Business analytics response:', businessAnalytics);
            console.log('📊 Conversations count response:', conversationsCountResponse);
            
            // Calculate utilization percentage based on actual active plan limits
            let utilizationPercentage = 0;
            // Note: We'll calculate this after activePlanLimits is available in the component

            const finalUsageData = {
              conversationsCount: conversationsCountResponse.data?.count || 0, // Use correct conversation count
              expertsCount: calculatedMetrics?.expertsCount || 0,
              departmentsCount: calculatedMetrics?.departmentsCount || 0,
              projectsCount: calculatedMetrics?.projectsCount || 0,
              utilizationPercentage: Math.max(0, Math.min(100, utilizationPercentage || 0)),
              totalQuestions: businessAnalytics.data.counts?.totalQuestions || 0, // Use actual questions count
              unansweredQuestions: businessAnalytics.data.counts?.unansweredQuestions || 0,
              averageResponseTime: businessAnalytics.data.timing?.averageResponseTimeMinutes || 0,
              fastestResponseTime: businessAnalytics.data.timing?.fastestResponseTimeMinutes || 0,
              slowestResponseTime: businessAnalytics.data.timing?.slowestResponseTimeMinutes || 0,
              totalAnswered: businessAnalytics.data.counts?.answeredQuestions || 0 // Use actual answered questions count
            };
            
            console.log('✅ Setting usage data from calculate endpoint:', finalUsageData);
            setUsageData(finalUsageData);
            
            // Successfully used calculate endpoint, return early
            console.log('🎉 Successfully completed calculate endpoint analytics fetch');
            return;
          } catch (subscriptionError) {
            // Check if the error is specifically about no active subscription
            const isNoSubscriptionError = subscriptionError.response?.data?.message?.includes('No active subscription found');
            
            if (isNoSubscriptionError) {
              console.log('ℹ️ No active subscription found for business, using fallback calculation');
            } else {
              console.error('❌ Error fetching calculated usage analytics:', subscriptionError);
            }
            // Continue to fallback logic below
          }
        } else {
          console.log('ℹ️ No active subscription plan available (currentPlan:', currentPlan, '), using manual calculation');
        }
        
        // Fallback to manual calculation
        console.log('🔄 Starting fallback manual calculation');
        const [businessAnalytics, departmentsData, usersData, conversationsCountResponse] = await Promise.all([
          agentQuestions.getBusinessAnalytics(stateBusinessId).catch(() => ({ data: { counts: {}, timing: {} } })),
          departments.getByBusinessId(stateBusinessId).catch(() => ({ data: [] })),
          users.getByBusinessId(stateBusinessId).catch(() => ({ data: [] })),
          conversations.countByBusinessId(stateBusinessId).catch(() => ({ data: { count: 0 } }))
        ]);
        
        console.log('📊 Fallback API responses:', { businessAnalytics, departmentsData, usersData, conversationsCountResponse });

        const conversationsCount = conversationsCountResponse.data?.count || 0;
        const departmentsCount = departmentsData.data?.length || 0;
        const expertsCount = usersData.data?.filter(user => user.role === 'AGENT')?.length || 0;
        
        console.log('🧮 Fallback calculated counts:', { conversationsCount, departmentsCount, expertsCount });
        
        let utilizationPercentage = 0;
        // Note: We'll calculate utilization using activePlanLimits in the component

        const fallbackUsageData = {
          conversationsCount,
          expertsCount,
          departmentsCount,
          projectsCount: businessAnalytics.data.counts?.projectCount || 0,
          utilizationPercentage: Math.max(0, Math.min(100, utilizationPercentage)),
          totalQuestions: businessAnalytics.data.counts?.totalQuestions || 0, // Use actual questions count, not conversations
          unansweredQuestions: businessAnalytics.data.counts?.unansweredQuestions || 0,
          averageResponseTime: businessAnalytics.data.timing?.averageResponseTimeMinutes || 0,
          fastestResponseTime: businessAnalytics.data.timing?.fastestResponseTimeMinutes || 0,
          slowestResponseTime: businessAnalytics.data.timing?.slowestResponseTimeMinutes || 0,
          totalAnswered: businessAnalytics.data.counts?.answeredQuestions || 0 // Use actual answered questions count
        };
        
        console.log('✅ Setting usage data from fallback calculation:', fallbackUsageData);
        setUsageData(fallbackUsageData);
        
      } catch (error) {
        console.error('❌ Error in fallback usage calculation:', error);
        // Final fallback to zero data
        const zeroUsageData = {
          conversationsCount: 0,
          expertsCount: 0,
          departmentsCount: 0,
          projectsCount: 0,
          utilizationPercentage: 0,
          totalQuestions: 0,
          unansweredQuestions: 0,
          averageResponseTime: 0,
          fastestResponseTime: 0,
          slowestResponseTime: 0,
          totalAnswered: 0
        };
        console.log('🔄 Setting zero usage data as final fallback:', zeroUsageData);
        setUsageData(zeroUsageData);
      } finally {
        console.log('🏁 Analytics loading complete, setting analyticsLoading to false');
        setAnalyticsLoading(false);
      }
    };

    console.log('🎯 useEffect triggered with dependencies:', { stateBusinessId, token: !!token, currentPlan: !!currentPlan });
    if (stateBusinessId) {
      fetchUsageAnalytics();
    } else {
      console.log('❌ No stateBusinessId available, skipping analytics fetch');
    }
  }, [token, stateBusinessId, currentPlan]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!token || !subscriptionPlanId) {
        console.log('❌ Missing token or subscriptionPlanId:', { 
          hasToken: !!token, 
          subscriptionPlanId 
        });
        setIsLoading(false);
        setUpdateError('Please log in to view subscription information');
        return;
      }

      try {
        console.log('🔄 Starting subscription data fetch...');
        setIsLoading(true);
        setUpdateError(null);

        // Get all available plans
        console.log('📊 Fetching subscription plans...');
        const plansResponse = await subscriptionPlans.getAll(true, 'price')
          .catch(error => {
            console.error('❌ Error fetching plans:', error);
            throw error;
          });

        const plans = plansResponse.data;
        setAllPlans(plans);

        // Find current plan using subscriptionPlanId from token
        const currentPlan = plans.find(plan => plan.planId === subscriptionPlanId);
        console.log('🔍 Current plan lookup:', {
          subscriptionPlanId,
          found: !!currentPlan,
          planDetails: currentPlan
        });
        
        setCurrentPlan(currentPlan || null);

        if (!currentPlan) {
          console.warn('⚠️ Current plan not found in available plans');
          setUpdateError('Current subscription plan not found. Please contact support.');
        }
      } catch (error) {
        console.error('❌ Error fetching subscription data:', error);
        setUpdateError('Failed to load subscription information. Please try again later.');
        setAllPlans([]);
        setCurrentPlan(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [token, subscriptionPlanId]);

  // Update useEffect for handling subscription updates
  useEffect(() => {
    let updateTimeout;
    const updateSubscriptionDetails = async () => {
      if (!pendingUpdates || !subscriptionInfo?.id) {
        console.log('⏭️ Skipping update - no pending updates or subscription ID:', {
          hasPendingUpdates: !!pendingUpdates,
          subscriptionId: subscriptionInfo?.id
        });
        return;
      }

      try {
        // 1. Sync the subscription first (commented out due to 400 error)
        // await stripeService.syncSubscription(subscriptionInfo.id);

        // Get current plan details
        const planDetails = currentPlanDetails;
        
        console.log('📦 Current State Payload:', JSON.stringify({
          subscriptionId: subscriptionInfo.id,
          currentState: {
            status: subscriptionInfo.status,
            cancelAtPeriodEnd: subscriptionInfo.cancelAtPeriodEnd,
            currentPeriodStart: subscriptionInfo.currentPeriodStart,
            currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
            plan: {
              name: planDetails.name,
              planId: planDetails.planId,
              amount: planDetails.amount
            }
          },
          pendingUpdates,
          currentPlan: {
            planId: planDetails.planId,
            name: planDetails.name
          }
        }, null, 2));
        
        setIsUpdatingDetails(true);
        setUpdateError(null);

        // Only update if there are actual changes
        const hasChanges = Object.keys(pendingUpdates).some(key => {
          if (key === 'metadata') {
            return JSON.stringify(pendingUpdates.metadata) !==
                   JSON.stringify(subscriptionInfo.metadata || {});
          }
          return pendingUpdates[key] !== subscriptionInfo[key];
        });

        if (!hasChanges) {
          console.log('ℹ️ No actual changes to update, skipping');
          setPendingUpdates(null);
          return;
        }

        const updateData = {
          businessId: stateBusinessId,
          planId: planDetails.planId,
          status: (subscriptionInfo.status || '').toUpperCase(),
          currentPeriodStart: subscriptionInfo.currentPeriodStart
            ? new Date(subscriptionInfo.currentPeriodStart).toISOString()
            : null,
          currentPeriodEnd: subscriptionInfo.currentPeriodEnd
            ? new Date(subscriptionInfo.currentPeriodEnd).toISOString()
            : null,
          cancelAtPeriodEnd: pendingUpdates.cancelAtPeriodEnd ?? subscriptionInfo.cancelAtPeriodEnd,
          subscriptionStartDate: subscriptionInfo.created
            ? new Date(subscriptionInfo.created).toISOString()
            : null,
          paymentMethodId: subscriptionInfo.defaultPaymentMethod,
          prorationBehavior: pendingUpdates.prorationBehavior || 'create_prorations',
          metadata: {
            ...subscriptionInfo.metadata,
            ...pendingUpdates.metadata,
            planName: planDetails.name,
            planAmount: planDetails.amount
          }
        };

        console.log('📦 Update Request Payload:', JSON.stringify(updateData, null, 2));

        const response = await stripeService.updateSubscriptionDetails(subscriptionInfo.id, updateData);

        console.log('✅ Update successful, refreshing subscription info');
        
        setPendingUpdates(null);

        // Refresh subscription info with updated plan details
        const refreshedInfo = await stripeService.getBusinessSubscriptionInfo(stateBusinessId);
        
        if (refreshedInfo.data.success && refreshedInfo.data.data.subscriptions?.length > 0) {
          const subscription = refreshedInfo.data.data.subscriptions[0];
          
          console.log('📦 Updated Subscription Payload:', JSON.stringify({
            id: subscription.id,
            status: subscription.status,
            plan: {
              name: planDetails.name,
              amount: subscription.plan.amount,
              interval: subscription.plan.interval
            },
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            metadata: subscription.metadata
          }, null, 2));
          
          setSubscriptionInfo({
            ...subscription,
            plan: {
              ...subscription.plan,
              name: planDetails.name
            }
          });
        }

      } catch (error) {
        console.error('❌ Error Payload:', JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack
          },
          response: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          },
          subscriptionId: subscriptionInfo?.id,
          pendingUpdates,
          currentState: {
            plan: currentPlanDetails,
            status: subscriptionInfo.status
          }
        }, null, 2));

        setUpdateError(error.response?.data?.message || error.message || 'Failed to update subscription');
      } finally {
        setIsUpdatingDetails(false);
      }
    };

    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateSubscriptionDetails();
    }, 1000);

    return () => clearTimeout(updateTimeout);
  }, [pendingUpdates, subscriptionInfo, stateBusinessId, currentPlanDetails]);

  // Update the initial subscription update trigger
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!token || !stateBusinessId) {
        console.log('❌ Missing token or stateBusinessId for subscription info');
        return;
      }

      try {
        console.log('🔄 Fetching subscription info for business:', stateBusinessId);
        const response = await stripeService.getBusinessSubscriptionInfo(stateBusinessId);
        console.log('📊 Subscription info received:', response.data);
        
        if (response.data.success && response.data.data.subscriptions?.length > 0) {
          const subscription = response.data.data.subscriptions[0];
          setSubscriptionInfo({
            id: subscription.id,
            status: subscription.status,
            created: subscription.created,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currency: subscription.currency,
            collectionMethod: subscription.collectionMethod,
            plan: subscription.plan
          });

          // Only trigger initial update if we don't have subscription info yet
          if (!subscriptionInfo) {
            console.log('🔄 Triggering initial subscription update');
            setPendingUpdates({
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              metadata: {
                lastUpdated: new Date().toISOString(),
                updatedBy: 'system',
                updateType: 'initial_sync',
                source: 'page_load'
              }
            });
          }
        } else {
          console.warn('⚠️ No active subscriptions found:', response.data);
          setSubscriptionInfo({
            status: 'inactive',
            error: 'No active subscription found'
          });
        }
      } catch (error) {
        console.error('❌ Error fetching subscription info:', error);
        setSubscriptionInfo({
          status: 'error',
          error: 'Failed to fetch subscription information'
        });
      }
    };

    fetchSubscriptionInfo();
  }, [token, stateBusinessId]);

  // Update handleToggleAutoRenew to use pendingUpdates
  const handleToggleAutoRenew = useCallback(() => {
    console.log('🔄 Toggling auto-renew:', {
      currentValue: subscriptionInfo?.cancelAtPeriodEnd,
      newValue: !subscriptionInfo?.cancelAtPeriodEnd,
      subscriptionId: subscriptionInfo?.id
    });

    const updates = {
      cancelAtPeriodEnd: !subscriptionInfo?.cancelAtPeriodEnd,
      metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'user',
        updateType: 'auto_renew_toggle',
        previousValue: String(subscriptionInfo?.cancelAtPeriodEnd)
      }
    };

    console.log('📝 Setting pending updates:', updates);
    setPendingUpdates(updates);
  }, [subscriptionInfo]);

  // Add handleUpdateMetadata for other metadata updates
  const handleUpdateMetadata = useCallback((metadata) => {
    setPendingUpdates(prev => ({
      ...prev,
      metadata: {
        ...prev?.metadata,
        ...metadata,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'user'
      }
    }));
  }, []);

  // Add test update handler
  const handleTestUpdate = () => {
    setPendingUpdates({
      cancelAtPeriodEnd: !subscriptionInfo.cancelAtPeriodEnd,
      metadata: {
        ...subscriptionInfo.metadata,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'test_button'
      }
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUsagePercentage = (current, max) => {
    if (!current || !max || max === -1) return 0;
    return Math.round((current / max) * 100);
  };

  const formatLimitValue = (value) => {
    return value === -1 ? 'Unlimited' : value;
  };

  const formatBillingInterval = (interval) => {
    switch (interval) {
      case 'MONTHLY':
        return 'month';
      case 'YEARLY':
        return 'year';
      case 'QUARTERLY':
        return 'quarter';
      default:
        return interval.toLowerCase();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsageLimits = (plan) => {
    return [
      { label: 'Conversations', value: plan.maxConversations, total: currentPlan?.maxConversations },
      { label: 'Experts', value: plan.maxExperts, total: currentPlan?.maxExperts },
      { label: 'Departments', value: plan.maxDepartments, total: currentPlan?.maxDepartments },
      { label: 'Projects per Department', value: plan.maxProjectsPerDepartment, total: currentPlan?.maxProjectsPerDepartment }
    ];
  };

  // Memoize handlers
  const handleCloseModal = useCallback(() => {
    setShowPlansModal(false);
  }, []);

  const handlePlanSelect = useCallback(async (plan) => {
    if (!stateBusinessId) {
      console.error('❌ Business ID is missing');
      setUpdateError('Business ID is required to update subscription');
      return;
    }

    if (currentPlan?.planId === plan.planId) {
      console.log('ℹ️ Selected plan is the same as current plan');
      setShowPlansModal(false);
      return;
    }

    try {
      console.log('🔄 Starting plan update process:', {
        businessId: stateBusinessId,
        currentPlanId: currentPlan?.planId,
        newPlanId: plan.planId
      });

      setIsUpdatingPlan(true);
      setUpdateError(null);

      // Create a Stripe Checkout Session
      console.log('💳 Creating Stripe checkout session...');
      const { data: session } = await stripeService.createCheckoutSession(stateBusinessId, plan.planId);
      console.log('✅ Checkout session created:', session);
      
      // Redirect to Stripe Checkout
      console.log('🔄 Initializing Stripe redirect...');
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      console.log('🔄 Redirecting to Stripe Checkout...');
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId
      });

      if (error) {
        console.error('❌ Stripe redirect error:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('❌ Error updating subscription plan:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        message: error.message
      });

      let errorMessage = 'Failed to update subscription plan. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUpdateError(errorMessage);
    } finally {
      setIsUpdatingPlan(false);
    }
  }, [stateBusinessId, currentPlan]);

  const handleManageBilling = async () => {
    try {
      const { data } = await stripeService.createBillingPortalSession(stateBusinessId);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      setUpdateError('Failed to open billing portal. Please try again.');
    }
  };

  if (!isLogin) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <p>Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1 className="dashboard-title">
            {getGreeting()}, {businessName || 'User'}!
          </h1>
          <p className="dashboard-subtitle">
            Welcome back to your SupportHub dashboard. Here's what's happening with your business today.
          </p>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Introduction Video Section */}
        <section className="intro-video-section">
          <h2 className="section-title">Getting Started</h2>
          <div className="video-container">
            <div className="video-placeholder">
              <div className="video-icon">🎥</div>
              <h3>Welcome to SupportHub</h3>
              <p>Watch this quick introduction to learn how to set up and optimize your customer support experience.</p>
              <button className="play-button">
                <span className="play-icon">▶</span>
                <span>Watch Introduction</span>
              </button>
            </div>
          </div>
        </section>

        {/* Usage Section */}
        <section className="usage-section">
          <h2 className="section-title">Current Usage & Analytics</h2>
          
          {analyticsLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading usage analytics...</p>
            </div>
          ) : (
            <div className="usage-grid">
              {/* Conversations Counter Component */}
              <div className="usage-card">
                <ConversationsCounterPage />
              </div>

              {/* Conversations Usage */}
              <div className="usage-card">
                <h3>Conversations Usage</h3>
                <div className="progress-info">
                  <span>Used: {usageData?.conversationsCount || 0}</span>
                  <span>Limit: {formatLimitValue(activePlanLimits?.maxConversations)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getUsagePercentage(usageData?.conversationsCount, activePlanLimits?.maxConversations)}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {getUsagePercentage(usageData?.conversationsCount, activePlanLimits?.maxConversations)}% used
                </div>
              </div>

              {/* Answered Questions */}
              <div className="usage-card">
                <h3>Answered Questions</h3>
                <div className="progress-info">
                  <span>Answered: {(usageData?.totalQuestions || 0) - (usageData?.unansweredQuestions || 0)}</span>
                  <span>Total: {usageData?.totalQuestions || 0}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill storage" 
                    style={{ width: `${usageData?.totalQuestions > 0 ? Math.round(((usageData?.totalQuestions - usageData?.unansweredQuestions) / usageData?.totalQuestions) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {usageData?.totalQuestions > 0 ? Math.round(((usageData?.totalQuestions - usageData?.unansweredQuestions) / usageData?.totalQuestions) * 100) : 0}% answered
                </div>
              </div>

              {/* Unanswered Questions */}
              <div className="usage-card">
                <h3>Pending Questions</h3>
                <div className="progress-info">
                  <span>Pending: {usageData?.unansweredQuestions || 0}</span>
                  <span>Total: {usageData?.totalQuestions || 0}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${usageData?.totalQuestions > 0 ? Math.round((usageData?.unansweredQuestions / usageData?.totalQuestions) * 100) : 0}%`,
                      background: usageData?.unansweredQuestions > 0 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {usageData?.totalQuestions > 0 ? Math.round((usageData?.unansweredQuestions / usageData?.totalQuestions) * 100) : 0}% pending
                </div>
              </div>

              {/* Expert Seats */}
              <div className="usage-card">
                <h3>Expert Seats</h3>
                <div className="progress-info">
                  <span>Used: {usageData?.expertsCount || 0}</span>
                  <span>Limit: {formatLimitValue(activePlanLimits?.maxExperts)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getUsagePercentage(usageData?.expertsCount, activePlanLimits?.maxExperts)}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {getUsagePercentage(usageData?.expertsCount, activePlanLimits?.maxExperts)}% used
                </div>
              </div>

              {/* Departments */}
              <div className="usage-card">
                <h3>Departments</h3>
                <div className="progress-info">
                  <span>Active: {usageData?.departmentsCount || 0}</span>
                  <span>Limit: {formatLimitValue(activePlanLimits?.maxDepartments)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getUsagePercentage(usageData?.departmentsCount, activePlanLimits?.maxDepartments)}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {getUsagePercentage(usageData?.departmentsCount, activePlanLimits?.maxDepartments)}% used
                </div>
              </div>

              {/* Projects */}
              <div className="usage-card">
                <h3>Active Projects</h3>
                <div className="progress-info">
                  <span>Projects: {usageData?.projectsCount || 0}</span>
                  <span>Max per Dept: {formatLimitValue(activePlanLimits?.maxProjectsPerDepartment)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill storage" 
                    style={{ width: `${usageData?.departmentsCount > 0 ? Math.min(100, Math.round((usageData?.projectsCount / (usageData?.departmentsCount * (activePlanLimits?.maxProjectsPerDepartment || 1))) * 100)) : 0}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {usageData?.departmentsCount > 0 ? Math.min(100, Math.round((usageData?.projectsCount / (usageData?.departmentsCount * (activePlanLimits?.maxProjectsPerDepartment || 1))) * 100)) : 0}% capacity used
                </div>
              </div>

              {/* Response Time (if available) */}
              {usageData?.averageResponseTime !== undefined && (
                <div className="usage-card">
                  <h3>Avg Response Time</h3>
                  <div className="progress-info">
                    <span>Average: {Math.round(usageData.averageResponseTime)} min</span>
                    <span>Performance Metric</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(100, (24 * 60 - usageData.averageResponseTime) / (24 * 60) * 100)}%`,
                        background: usageData.averageResponseTime < 60 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 
                                   usageData.averageResponseTime < 240 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 
                                   'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {usageData.averageResponseTime < 60 ? 'Excellent' : 
                     usageData.averageResponseTime < 240 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
              )}

              {/* Overall Utilization */}
              {activePlanLimits && (
                <div className="usage-card">
                  <h3>Plan Utilization</h3>
                  <div className="progress-info">
                    <span>Efficiency: {Math.round(calculatedUtilizationPercentage)}%</span>
                    <span>{activePlanLimits.name}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill storage" 
                      style={{ width: `${calculatedUtilizationPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {Math.round(calculatedUtilizationPercentage)}% plan utilization
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Subscription Section */}
        <section className="subscription-section">
          <h2 className="section-title">Subscription Details</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading subscription information...</p>
            </div>
          ) : updateError ? (
            <div className="error-message">
              {updateError}
              <button 
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : currentPlan ? (
            <div className="subscription-card">
              <div className="subscription-header">
                <div className="tier-info">
                  <h3>{currentPlanDetails.name}</h3>
                  {subscriptionInfo?.status && (
                    <span className={`status-badge ${subscriptionInfo.status?.toLowerCase()}`}>
                      {subscriptionInfo.status}
                    </span>
                  )}
                </div>
                <div className="plan-price-info">
                  <span className="price-amount">${currentPlanDetails.amount / 100}</span>
                  <span className="price-interval">
                    per {formatBillingInterval(currentPlan?.billingInterval)}
                  </span>
                </div>
              </div>

              {subscriptionInfo && (
                <div className="subscription-details">
                  {subscriptionInfo.error ? (
                    <div className="subscription-error">
                      <span className="error-icon">⚠️</span>
                      <span>{subscriptionInfo.error}</span>
                    </div>
                  ) : (
                    <>
                      <div className="detail-row">
                        <span>Subscription ID:</span>
                        <span>{subscriptionInfo.id || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Collection Method:</span>
                        <span>{subscriptionInfo.collectionMethod?.replace('_', ' ').charAt(0).toUpperCase() + subscriptionInfo.collectionMethod?.slice(1) || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Created:</span>
                        <span>{formatDate(subscriptionInfo.created) || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Current Period Start:</span>
                        <span>{formatDate(subscriptionInfo.currentPeriodStart) || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Current Period End:</span>
                        <span>{formatDate(subscriptionInfo.currentPeriodEnd) || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Auto-Renew:</span>
                        <span className={subscriptionInfo.cancelAtPeriodEnd ? 'status canceled' : 'status active'}>
                          {subscriptionInfo.cancelAtPeriodEnd ? 'No' : 'Yes'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>Currency:</span>
                        <span>{subscriptionInfo.currency?.toUpperCase() || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <p className="plan-description">{currentPlan.description}</p>
              
              <div className="features-list">
                <h4>Plan Features:</h4>
                <ul>
                  <li>
                    <span className="feature-check">✓</span>
                    Expert Seats: {formatLimitValue(currentPlan.maxExperts)}
                  </li>
                  <li>
                    <span className="feature-check">✓</span>
                    Departments: {formatLimitValue(currentPlan.maxDepartments)}
                  </li>
                  <li>
                    <span className="feature-check">✓</span>
                    Projects per Department: {formatLimitValue(currentPlan.maxProjectsPerDepartment)}
                  </li>
                  <li>
                    <span className="feature-check">✓</span>
                    Conversations: {formatLimitValue(currentPlan.maxConversations)}
                  </li>
                </ul>
              </div>

              <div className="subscription-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => setShowPlansModal(true)}
                  disabled={isUpdatingPlan || isUpdatingDetails || (subscriptionInfo && subscriptionInfo.status === 'canceled')}
                >
                  {isUpdatingPlan ? 'Updating Plan...' : 'Change Plan'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleManageBilling}
                  disabled={!subscriptionInfo || subscriptionInfo.error || isUpdatingDetails}
                >
                  Manage Billing
                </button>
                {subscriptionInfo && !subscriptionInfo.error && (
                  <>
                    <button
                      className={`btn-secondary ${isUpdatingDetails ? 'loading' : ''}`}
                      onClick={handleToggleAutoRenew}
                      disabled={isUpdatingDetails || subscriptionInfo.status === 'canceled'}
                    >
                      {isUpdatingDetails ? 'Updating...' : 
                       subscriptionInfo.cancelAtPeriodEnd ? 'Enable Auto-Renew' : 'Disable Auto-Renew'}
                    </button>
                    <button
                      className="btn-test"
                      onClick={handleTestUpdate}
                      disabled={isUpdatingDetails || subscriptionInfo.status === 'canceled'}
                    >
                      Test Update
                    </button>
                  </>
                )}
                {updateError && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <span>{updateError}</span>
                    <button 
                      className="dismiss-error" 
                      onClick={() => setUpdateError(null)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-subscription">
              <p>No active subscription found.</p>
              <button 
                className="btn-primary"
                onClick={() => setShowPlansModal(true)}
              >
                Choose a Plan
              </button>
            </div>
          )}
        </section>

        {/* Billing & Invoices Section */}
        <section className="billing-section">
          <InvoiceComponent />
        </section>

        {/* Recent Activity Section */}
        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-detail">{activity.detail}</div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card">
              <span className="action-icon">🔧</span>
              <span className="action-text">Create New Widget</span>
            </button>
            <button className="action-card">
              <span className="action-icon">📊</span>
              <span className="action-text">View Analytics</span>
            </button>
            <button className="action-card">
              <span className="action-icon">⚙️</span>
              <span className="action-text">Manage Settings</span>
            </button>
            <button className="action-card">
              <span className="action-icon">📚</span>
              <span className="action-text">Documentation</span>
            </button>
          </div>
        </section>
      </div>

      {/* Render the modal */}
      <SubscriptionPlansModal 
        isOpen={showPlansModal}
        onClose={handleCloseModal}
        allPlans={allPlans}
        currentPlan={currentPlan}
        onPlanSelect={handlePlanSelect}
        isUpdatingPlan={isUpdatingPlan}
        updateError={updateError}
        onErrorDismiss={() => setUpdateError(null)}
      />
    </div>
  );
};

export default DashboardPage; 