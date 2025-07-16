import { useSubscriptionContext } from '../context/SubscriptionContext';

/**
 * Custom hook for checking subscription limits before operations
 * Provides easy-to-use methods for validating operations against plan limits
 */
export const useSubscriptionLimits = () => {
  const {
    currentPlan,
    subscriptionInfo,
    usageMetrics,
    planLimits,
    isLoading,
    error,
    checkOperationAllowed,
    refreshSubscriptionData,
    refreshUsageMetrics,
    getUsagePercentage,
    isUnlimited,
    getRemaining,
    // Individual metric states
    conversationsUsage,
    expertsUsage,
    departmentsUsage,
    projectsUsage,
    // State update trigger
    updateTrigger,
    // Individual metric refresh methods
    refreshConversationsUsage,
    refreshExpertsUsage,
    refreshDepartmentsUsage,
    refreshProjectsUsage,
    // Manual update function for immediate UI updates
    updateProjectsUsageImmediately
  } = useSubscriptionContext();

  /**
   * Check if subscription is active
   */
  const isSubscriptionActive = () => {
    return subscriptionInfo?.status === 'active' && !subscriptionInfo?.error;
  };

  /**
   * Check if user can create a new conversation
   */
  const canCreateConversation = () => {
    const result = checkOperationAllowed('create_conversation');
    return result.allowed;
  };

  /**
   * Check if user can add a new expert/agent
   */
  const canAddExpert = () => {
    const result = checkOperationAllowed('add_expert');
    return result.allowed;
  };

  /**
   * Check if user can add a new department
   */
  const canAddDepartment = () => {
    const result = checkOperationAllowed('add_department');
    return result.allowed;
  };

  /**
   * Check if user can add a new project
   */
  const canAddProject = () => {
    const result = checkOperationAllowed('add_project');
    return result.allowed;
  };

  /**
   * Get detailed information about why an operation is not allowed
   */
  const getOperationReason = (operationType) => {
    const result = checkOperationAllowed(operationType);
    return result.reason;
  };

  /**
   * Check if a specific metric is unlimited
   */
  const isMetricUnlimited = (metric) => {
    return isUnlimited(metric);
  };

  /**
   * Get remaining count for a specific metric
   */
  const getRemainingCount = (metric) => {
    return getRemaining(metric);
  };

  /**
   * Get usage percentage for a specific metric
   */
  const getMetricUsagePercentage = (metric) => {
    return getUsagePercentage(metric);
  };

  /**
   * Get formatted usage information for display
   */
  const getUsageInfo = (metric) => {
    const current = usageMetrics[`${metric}Count`] || 0;
    const limit = planLimits[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}`];
    const percentage = getMetricUsagePercentage(metric);
    const remaining = getRemainingCount(metric);
    const unlimited = isMetricUnlimited(metric);

    return {
      current,
      limit: unlimited ? 'Unlimited' : limit,
      percentage,
      remaining: unlimited ? 'Unlimited' : remaining,
      unlimited,
      isAtLimit: !unlimited && remaining === 0,
      isNearLimit: !unlimited && percentage >= 80
    };
  };

  /**
   * Get individual metric usage information
   */
  const getIndividualUsageInfo = (metric) => {
    switch (metric) {
      case 'conversations':
        return conversationsUsage;
      case 'experts':
        return expertsUsage;
      case 'departments':
        return departmentsUsage;
      case 'projects':
        return projectsUsage;
      default:
        return getUsageInfo(metric);
    }
  };

  /**
   * Validate operation and show user-friendly error if needed
   */
  const validateOperation = (operationType, onError) => {
    const result = checkOperationAllowed(operationType);
    
    if (!result.allowed) {
      const errorMessage = result.reason || 'Operation not allowed with current subscription plan';
      
      if (onError && typeof onError === 'function') {
        onError(errorMessage);
      } else {
        // Default error handling - show alert
        alert(`Operation Failed: ${errorMessage}\n\nPlease upgrade your subscription plan to continue.`);
      }
      
      return false;
    }
    
    return true;
  };

  /**
   * Get subscription status summary
   */
  const getSubscriptionStatus = () => {
    if (isLoading) {
      return { status: 'loading', message: 'Loading subscription information...' };
    }
    
    if (error) {
      return { status: 'error', message: error };
    }
    
    if (!currentPlan) {
      return { status: 'no_plan', message: 'No subscription plan found' };
    }
    
    if (!isSubscriptionActive()) {
      return { 
        status: 'inactive', 
        message: subscriptionInfo?.error || 'Subscription is not active' 
      };
    }
    
    return { 
      status: 'active', 
      message: `Active ${currentPlan.name} subscription`,
      plan: currentPlan
    };
  };

  /**
   * Get all usage information for dashboard display
   */
  const getAllUsageInfo = () => {
    return {
      conversations: getIndividualUsageInfo('conversations'),
      experts: getIndividualUsageInfo('experts'),
      departments: getIndividualUsageInfo('departments'),
      projects: getIndividualUsageInfo('projects'),
      overall: {
        utilizationPercentage: usageMetrics.utilizationPercentage,
        totalQuestions: usageMetrics.totalQuestions,
        unansweredQuestions: usageMetrics.unansweredQuestions,
        averageResponseTime: usageMetrics.averageResponseTime
      }
    };
  };

  /**
   * Check if project creation is allowed based on current usage
   */
  const canCreateProject = () => {
    return canAddProject();
  };

  /**
   * Get project creation status with detailed information
   */
  const getProjectCreationStatus = () => {
    const projectsInfo = getIndividualUsageInfo('projects');
    
    if (projectsInfo.unlimited) {
      return {
        allowed: true,
        reason: null,
        usage: projectsInfo
      };
    }
    
    const allowed = !projectsInfo.isAtLimit;
    const reason = projectsInfo.isAtLimit 
      ? `Project limit reached (${projectsInfo.current}/${projectsInfo.limit})`
      : null;
    
    return {
      allowed,
      reason,
      usage: projectsInfo
    };
  };

  return {
    // State
    currentPlan,
    subscriptionInfo,
    usageMetrics,
    planLimits,
    isLoading,
    error,
    
    // Individual metric states
    conversationsUsage,
    expertsUsage,
    departmentsUsage,
    projectsUsage,
    
    // State update trigger
    updateTrigger,
    
    // Core methods
    checkOperationAllowed,
    refreshSubscriptionData,
    refreshUsageMetrics,
    
    // Individual metric refresh methods
    refreshConversationsUsage,
    refreshExpertsUsage,
    refreshDepartmentsUsage,
    refreshProjectsUsage,
    
    // Manual update function for immediate UI updates
    updateProjectsUsageImmediately,
    
    // Convenience methods
    isSubscriptionActive,
    canCreateConversation,
    canAddExpert,
    canAddDepartment,
    canAddProject,
    canCreateProject,
    getOperationReason,
    validateOperation,
    
    // Usage information
    getUsageInfo,
    getIndividualUsageInfo,
    getAllUsageInfo,
    getSubscriptionStatus,
    getProjectCreationStatus,
    isMetricUnlimited,
    getRemainingCount,
    getMetricUsagePercentage
  };
}; 