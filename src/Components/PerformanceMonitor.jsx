import React, { useState, useEffect } from 'react';
import './PerformanceMonitor.css';

const PerformanceMonitor = ({ data, loading, lastFetch, isCached, onClearCache }) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    cacheHits: 0,
    apiCalls: 0,
    lastLoadType: 'fresh'
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInProduction, setShowInProduction] = useState(false);

  // Track performance metrics
  useEffect(() => {
    if (!loading.overall && data.subscription && data.usage) {
      const now = Date.now();
      const loadTime = lastFetch ? now - lastFetch : 0;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTime,
        lastLoadType: isCached('SUBSCRIPTION') || isCached('USAGE') ? 'cached' : 'fresh',
        cacheHits: prev.cacheHits + (isCached('SUBSCRIPTION') ? 1 : 0) + (isCached('USAGE') ? 1 : 0),
        apiCalls: prev.apiCalls + (isCached('SUBSCRIPTION') ? 0 : 1) + (isCached('USAGE') ? 0 : 1)
      }));
    }
  }, [loading.overall, data, lastFetch, isCached]);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const getLoadTimeColor = (time) => {
    if (time < 200) return '#10b981'; // Green - Excellent
    if (time < 500) return '#f59e0b'; // Yellow - Good  
    if (time < 1000) return '#f97316'; // Orange - Okay
    return '#ef4444'; // Red - Poor
  };

  const getLoadTypeIcon = (type) => {
    switch (type) {
      case 'cached': return '⚡';
      case 'fresh': return '🔄';
      default: return '📊';
    }
  };

  return (
    <div className={`performance-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Compact Header */}
      <div 
        className="performance-header"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Click to expand performance metrics"
      >
        <div className="performance-indicator">
          <span className="performance-icon">
            {getLoadTypeIcon(performanceMetrics.lastLoadType)}
          </span>
          <span 
            className="performance-time"
            style={{ color: getLoadTimeColor(performanceMetrics.loadTime) }}
          >
            {performanceMetrics.loadTime}ms
          </span>
        </div>
        
        <div className="performance-status">
          {loading.overall ? (
            <span className="loading-indicator">🔄 Loading...</span>
          ) : (
            <span className="loaded-indicator">✅ Loaded</span>
          )}
        </div>
        
        <button 
          className="expand-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Expanded Metrics */}
      {isExpanded && (
        <div className="performance-details">
          <div className="metrics-grid">
            {/* Load Time */}
            <div className="metric-card">
              <div className="metric-label">Load Time</div>
              <div 
                className="metric-value"
                style={{ color: getLoadTimeColor(performanceMetrics.loadTime) }}
              >
                {performanceMetrics.loadTime}ms
              </div>
              <div className="metric-description">
                {performanceMetrics.loadTime < 200 && "🚀 Excellent"}
                {performanceMetrics.loadTime >= 200 && performanceMetrics.loadTime < 500 && "✅ Good"}
                {performanceMetrics.loadTime >= 500 && performanceMetrics.loadTime < 1000 && "⚠️ Okay"}
                {performanceMetrics.loadTime >= 1000 && "❌ Poor"}
              </div>
            </div>

            {/* Cache Performance */}
            <div className="metric-card">
              <div className="metric-label">Cache Hits</div>
              <div className="metric-value cache-hits">
                {performanceMetrics.cacheHits}
              </div>
              <div className="metric-description">
                {performanceMetrics.cacheHits > 0 ? "📦 Using cache" : "🔄 Fresh load"}
              </div>
            </div>

            {/* API Efficiency */}
            <div className="metric-card">
              <div className="metric-label">API Calls</div>
              <div className="metric-value">
                {performanceMetrics.apiCalls}
              </div>
              <div className="metric-description">
                {performanceMetrics.apiCalls <= 2 ? "⚡ Optimized" : "🐌 Heavy"}
              </div>
            </div>

            {/* Load Type */}
            <div className="metric-card">
              <div className="metric-label">Load Type</div>
              <div className="metric-value">
                {getLoadTypeIcon(performanceMetrics.lastLoadType)} {performanceMetrics.lastLoadType}
              </div>
              <div className="metric-description">
                {performanceMetrics.lastLoadType === 'cached' ? "Instant load" : "Network fetch"}
              </div>
            </div>
          </div>

          {/* Cache Status */}
          <div className="cache-status">
            <div className="cache-section">
              <h4>Cache Status</h4>
              <div className="cache-items">
                <div className={`cache-item ${isCached('SUBSCRIPTION') ? 'cached' : 'fresh'}`}>
                  <span>Subscription:</span>
                  <span>{isCached('SUBSCRIPTION') ? '📦 Cached' : '🔄 Fresh'}</span>
                </div>
                <div className={`cache-item ${isCached('USAGE') ? 'cached' : 'fresh'}`}>
                  <span>Usage Data:</span>
                  <span>{isCached('USAGE') ? '📦 Cached' : '🔄 Fresh'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="performance-tips">
            <h4>💡 Optimization Tips</h4>
            <ul>
              {performanceMetrics.loadTime > 1000 && (
                <li>Consider enabling caching for faster subsequent loads</li>
              )}
              {performanceMetrics.apiCalls > 3 && (
                <li>Multiple API calls detected - consider consolidating endpoints</li>
              )}
              {!isCached('SUBSCRIPTION') && !isCached('USAGE') && (
                <li>No cache detected - data will load faster on next visit</li>
              )}
              {performanceMetrics.loadTime < 200 && (
                <li>🎉 Excellent performance! Cache is working optimally</li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="performance-actions">
            <button 
              className="clear-cache-btn"
              onClick={onClearCache}
              title="Clear all cached data"
            >
              🗑️ Clear Cache
            </button>
            <button 
              className="refresh-btn"
              onClick={() => window.location.reload()}
              title="Refresh page"
            >
              🔄 Refresh
            </button>
            {process.env.NODE_ENV === 'production' && (
              <button
                className="hide-monitor-btn"
                onClick={() => setShowInProduction(false)}
                title="Hide performance monitor"
              >
                👁️ Hide
              </button>
            )}
          </div>

          {/* Technical Details */}
          <details className="technical-details">
            <summary>🔧 Technical Details</summary>
            <div className="tech-info">
              <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
              <div><strong>User Agent:</strong> {navigator.userAgent.split(' ')[0]}</div>
              <div><strong>Connection:</strong> {navigator.connection?.effectiveType || 'Unknown'}</div>
              <div><strong>Memory:</strong> {navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown'}</div>
              <div><strong>Cores:</strong> {navigator.hardwareConcurrency || 'Unknown'}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 