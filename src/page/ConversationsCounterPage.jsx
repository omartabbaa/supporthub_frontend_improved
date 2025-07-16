import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUserContext } from '../context/LoginContext';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import './DashboardPage.css';

const BASE_URL = 'http://localhost:8080'; // Change to your backend URL if needed

const ConversationsCounterPage = () => {
  const { isLogin, token, stateBusinessId } = useUserContext();
  const { maxConversations, isLoading: subscriptionLoading, error: subscriptionError } = useSubscriptionContext();

  const [conversationsCount, setConversationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Monthly reset test states
  const [resetCheckData, setResetCheckData] = useState(null);
  const [isCheckingReset, setIsCheckingReset] = useState(false);
  const [isForcingReset, setIsForcingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // Helper to get usage percentage
  const getUsagePercentage = (current, max) => {
    if (!max || max === -1) return 0;
    return Math.round((current / max) * 100);
  };

  // Helper to format limit
  const formatLimitValue = (value) => {
    return value === -1 ? 'Unlimited' : value;
  };

  // Set up axios instance with token
  const getApiInstance = useCallback(() => {
    return axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    });
  }, [token]);

  // Test function to check if monthly reset is needed
  const testCheckMonthlyReset = async () => {
    if (!token || !stateBusinessId) {
      setResetMessage('Missing token or business ID.');
      return;
    }

    setIsCheckingReset(true);
    setResetMessage('');
    setResetCheckData(null);

    try {
      const api = getApiInstance();
      const response = await api.get(`/api/subscription-usage/business/${stateBusinessId}/should-reset`);
      setResetCheckData(response.data);
      setResetMessage(`Check completed: ${response.data.shouldReset}`);
      console.log('🔄 Monthly reset check result:', response.data);
    } catch (err) {
      setResetMessage(`Error checking reset: ${err.response?.data?.message || err.message}`);
      console.error('❌ Error checking monthly reset:', err);
    } finally {
      setIsCheckingReset(false);
    }
  };

  // Test function to force reset monthly usage
  const testForceResetMonthlyUsage = async () => {
    if (!token || !stateBusinessId) {
      setResetMessage('Missing token or business ID.');
      return;
    }

    setIsForcingReset(true);
    setResetMessage('');

    try {
      const api = getApiInstance();
      const response = await api.patch(`/api/subscription-usage/business/${stateBusinessId}/force-reset-monthly-usage`);
      setResetMessage(`Force reset completed: ${response.data.message}`);
      console.log('🔄 Force reset result:', response.data);
      
      // Refresh conversations count after reset
      setTimeout(() => {
        fetchConversationsCount();
      }, 1000);
    } catch (err) {
      setResetMessage(`Error forcing reset: ${err.response?.data?.message || err.message}`);
      console.error('❌ Error forcing monthly reset:', err);
    } finally {
      setIsForcingReset(false);
    }
  };

  // Fetch conversations count using direct axios API calls
  const fetchConversationsCount = useCallback(async () => {
    if (!token || !stateBusinessId) {
      setError('Missing token or business ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const api = getApiInstance();

    try {
      // 1. Upsert business usage metrics
      await api.post(`/api/subscription-usage/business/${stateBusinessId}/upsert`);

      // 2. Calculate business metrics
      const calculateResponse = await api.get(`/api/subscription-usage/business/${stateBusinessId}/calculate`);
      const calculatedMetrics = calculateResponse.data;
      setConversationsCount(calculatedMetrics?.conversationsCount || 0);
    } catch (err) {
      // 3. Fallback: get business analytics
      try {
        const [countsResponse, timingResponse] = await Promise.all([
          api.get(`/api/agent-questions/count/business/${stateBusinessId}`),
          api.get(`/api/agent-questions/timing/business/${stateBusinessId}`),
        ]);
        setConversationsCount(countsResponse.data?.totalQuestions || 0);
      } catch (fallbackErr) {
        setError('Failed to fetch conversations count.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token, stateBusinessId, getApiInstance]);

  useEffect(() => {
    if (isLogin && token && stateBusinessId) {
      fetchConversationsCount();
    }
  }, [isLogin, token, stateBusinessId, fetchConversationsCount]);

  // Automatic monthly reset check and trigger
  useEffect(() => {
    if (!isLogin || !token || !stateBusinessId) return;

    const checkAndAutoReset = async () => {
      try {
        console.log('🔄 [Auto] Checking if monthly reset is needed...');
        const api = getApiInstance();
        
        // 1. Check if reset is needed
        const checkResponse = await api.get(`/api/subscription-usage/business/${stateBusinessId}/should-reset`);
        const checkData = checkResponse.data;
        
        console.log('🔄 [Auto] Reset check result:', checkData);
        
        if (checkData.shouldReset === "YES") {
          console.log('🔄 [Auto] Reset needed, triggering force reset...');
          
          // 2. If yes, force reset
          const resetResponse = await api.patch(`/api/subscription-usage/business/${stateBusinessId}/force-reset-monthly-usage`);
          console.log('🔄 [Auto] Force reset completed:', resetResponse.data);
          
          // 3. Refresh conversations count after reset
          setTimeout(() => {
            fetchConversationsCount();
          }, 1000);
          
          setResetMessage(`Auto-reset completed: ${resetResponse.data.message}`);
        } else {
          console.log('🔄 [Auto] No reset needed at this time');
        }
      } catch (err) {
        console.error('❌ [Auto] Error in automatic reset check:', err);
        setResetMessage(`Auto-reset error: ${err.response?.data?.message || err.message}`);
      }
    };

    // Run automatic check on page load
    checkAndAutoReset();
  }, [isLogin, token, stateBusinessId, getApiInstance, fetchConversationsCount]);

  if (!isLogin) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <p>Please log in to view your conversations usage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="usage-section">
        <h2 className="section-title">Conversations Usage</h2>
        {loading || subscriptionLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading conversations usage...</p>
          </div>
        ) : error || subscriptionError ? (
          <div className="loading-state">
            <p style={{ color: 'red' }}>{error || subscriptionError}</p>
          </div>
        ) : (
          <div className="usage-grid" style={{ maxWidth: 400, margin: '0 auto' }}>
            <div className={`usage-card`}>
              <h3>Conversations</h3>
              <div className="progress-info">
                <span>Current: {conversationsCount}</span>
                <span>Limit: {formatLimitValue(maxConversations)}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getUsagePercentage(conversationsCount, maxConversations)}%` }}
                ></div>
              </div>
              <div className="progress-percentage">
                {getUsagePercentage(conversationsCount, maxConversations)}% used
              </div>
              {maxConversations !== -1 && (
                <div style={{ marginTop: 8 }}>
                  {conversationsCount >= maxConversations ? (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      &#9888; Conversation limit reached! Upgrade your plan to continue.
                    </span>
                  ) : getUsagePercentage(conversationsCount, maxConversations) >= 80 ? (
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                      &#9888; Nearing your conversation limit.
                    </span>
                  ) : null}
                </div>
              )}
              <button
                className="refresh-usage-button"
                onClick={() => { setIsRefreshing(true); fetchConversationsCount(); }}
                disabled={isRefreshing}
                style={{ marginTop: 16 }}
              >
                {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Monthly Reset Test Section */}
      <section className="usage-section" style={{ marginTop: 32 }}>
        <h2 className="section-title">Monthly Reset Testing</h2>
        <div className="usage-grid" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="usage-card">
            <h3>Test Monthly Reset Functionality</h3>
            
            {/* Test Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                className="refresh-usage-button"
                onClick={testCheckMonthlyReset}
                disabled={isCheckingReset}
                style={{ flex: 1, minWidth: 200 }}
              >
                {isCheckingReset ? '⏳ Checking...' : '🔍 Check Reset Status'}
              </button>
              
              <button
                className="refresh-usage-button"
                onClick={testForceResetMonthlyUsage}
                disabled={isForcingReset}
                style={{ 
                  flex: 1, 
                  minWidth: 200,
                  backgroundColor: '#dc2626',
                  color: 'white'
                }}
              >
                {isForcingReset ? '⏳ Resetting...' : '🔄 Force Reset Conversations'}
              </button>
            </div>

            {/* Reset Message */}
            {resetMessage && (
              <div style={{ 
                padding: 12, 
                marginBottom: 16,
                backgroundColor: resetMessage.includes('Error') ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${resetMessage.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: 6,
                color: resetMessage.includes('Error') ? '#dc2626' : '#166534'
              }}>
                <strong>Status:</strong> {resetMessage}
              </div>
            )}

            {/* Reset Check Data Display */}
            {resetCheckData && (
              <div style={{ 
                padding: 16, 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14
              }}>
                <h4 style={{ marginTop: 0, marginBottom: 12 }}>Reset Check Details:</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Should Reset:</strong> 
                    <span style={{ 
                      color: resetCheckData.shouldReset === 'YES' ? '#dc2626' : '#166534',
                      fontWeight: 'bold',
                      marginLeft: 8
                    }}>
                      {resetCheckData.shouldReset}
                    </span>
                  </div>
                  <div><strong>Message:</strong> {resetCheckData.message}</div>
                  <div><strong>Current Conversations:</strong> {resetCheckData.currentConversationsCount}</div>
                  <div><strong>Days Since Last Reset:</strong> {resetCheckData.daysSinceLastReset}</div>
                  <div><strong>Days Until Next Reset:</strong> {resetCheckData.daysUntilNextReset}</div>
                  <div><strong>Is Reset Overdue:</strong> 
                    <span style={{ 
                      color: resetCheckData.isResetOverdue ? '#dc2626' : '#166534',
                      marginLeft: 8
                    }}>
                      {resetCheckData.isResetOverdue ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {resetCheckData.lastResetDate && (
                    <div><strong>Last Reset Date:</strong> {resetCheckData.lastResetDate}</div>
                  )}
                  {resetCheckData.nextResetDate && (
                    <div><strong>Next Reset Date:</strong> {resetCheckData.nextResetDate}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConversationsCounterPage; 