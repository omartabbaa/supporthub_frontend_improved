import React from 'react';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';

/**
 * SubscriptionLimitGuard - A wrapper component that checks subscription limits
 * before allowing operations. Can be used to protect features based on plan limits.
 */
const SubscriptionLimitGuard = ({ 
  children, 
  operationType, 
  fallback = null, 
  showUpgradePrompt = true,
  onLimitExceeded = null 
}) => {
  const { checkOperationAllowed, isSubscriptionActive } = useSubscriptionLimits();

  // Check if the operation is allowed
  const result = checkOperationAllowed(operationType);
  
  // If operation is allowed, render children
  if (result.allowed) {
    return <>{children}</>;
  }

  // If operation is not allowed and we have a custom fallback, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If operation is not allowed and subscription is not active, show upgrade prompt
  if (!isSubscriptionActive() && showUpgradePrompt) {
    return (
      <div className="subscription-limit-guard">
        <div className="limit-exceeded-message">
          <div className="limit-icon">🔒</div>
          <div className="limit-content">
            <h4>Feature Unavailable</h4>
            <p>This feature requires an active subscription plan.</p>
            <button 
              className="upgrade-button"
              onClick={() => window.location.href = '/dashboard'}
            >
              View Subscription Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If operation is not allowed due to plan limits, show limit exceeded message
  if (showUpgradePrompt) {
    return (
      <div className="subscription-limit-guard">
        <div className="limit-exceeded-message">
          <div className="limit-icon">⚠️</div>
          <div className="limit-content">
            <h4>Limit Exceeded</h4>
            <p>{result.reason || 'You have reached your plan limit for this feature.'}</p>
            <button 
              className="upgrade-button"
              onClick={() => window.location.href = '/dashboard'}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no fallback and no upgrade prompt, render nothing
  return null;
};

/**
 * SubscriptionLimitButton - A button component that automatically checks limits
 * before allowing clicks
 */
export const SubscriptionLimitButton = ({ 
  operationType, 
  onClick, 
  children, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const { validateOperation } = useSubscriptionLimits();

  const handleClick = (e) => {
    // Check if operation is allowed before proceeding
    if (validateOperation(operationType, (errorMessage) => {
      // Custom error handling - you could show a toast notification here
      console.warn('Operation blocked by subscription limits:', errorMessage);
    })) {
      // If allowed, call the original onClick handler
      if (onClick) {
        onClick(e);
      }
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * SubscriptionStatusIndicator - Shows current subscription status and usage
 */
export const SubscriptionStatusIndicator = ({ showDetails = false }) => {
  const { getSubscriptionStatus, getAllUsageInfo } = useSubscriptionLimits();
  
  const status = getSubscriptionStatus();
  const usageInfo = getAllUsageInfo();

  return (
    <div className="subscription-status-indicator">
      <div className="status-header">
        <span className={`status-dot ${status.status}`}></span>
        <span className="status-text">{status.message}</span>
      </div>
      
      {showDetails && status.status === 'active' && (
        <div className="usage-summary">
          <div className="usage-item">
            <span className="usage-label">Conversations:</span>
            <span className="usage-value">
              {usageInfo.conversations.current}/{usageInfo.conversations.limit}
            </span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Experts:</span>
            <span className="usage-value">
              {usageInfo.experts.current}/{usageInfo.experts.limit}
            </span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Departments:</span>
            <span className="usage-value">
              {usageInfo.departments.current}/{usageInfo.departments.limit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionLimitGuard; 