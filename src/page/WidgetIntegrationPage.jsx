import React, { useState, useEffect } from 'react';
import { useSidebarContext } from '../context/SidebarContext.jsx';
import { useUserContext } from '../context/LoginContext';
import { apiKeys as apiKeysService } from '../services/ApiService';
import './WidgetIntegrationPage.css';

const WidgetIntegrationPage = () => {
  // Add error boundary and safe context usage
  let setActiveSidebarType, stateBusinessId, token;
  
  try {
    const sidebarContext = useSidebarContext();
    setActiveSidebarType = sidebarContext?.setActiveSidebarType;
  } catch (error) {
    console.warn('SidebarContext not available:', error);
  }
  
  try {
    const userContext = useUserContext();
    stateBusinessId = userContext?.stateBusinessId;
    token = userContext?.token;
  } catch (error) {
    console.warn('UserContext not available:', error);
  }
  
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState('http://localhost:5175');

  // Safe effect with error handling
  useEffect(() => {
    try {
      if (setActiveSidebarType) {
        setActiveSidebarType('widget');
      }
    } catch (error) {
      console.warn('Error setting sidebar type:', error);
    }
  }, [setActiveSidebarType]);

  useEffect(() => {
    if (stateBusinessId && token) {
      fetchApiKeys();
    }
  }, [stateBusinessId, token]);

  const fetchApiKeys = async () => {
    if (!stateBusinessId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiKeysService.getByBusiness(stateBusinessId);
      // Filter out keys that are active AND have valid keyValue
      const activeKeys = response.data.filter(key => key && key.active && key.keyValue);
      setApiKeys(activeKeys);
      
      // Auto-select first active key if available
      if (activeKeys.length > 0 && !selectedApiKey) {
        setSelectedApiKey(activeKeys[0].keyValue);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateScriptTag = () => {
    if (!selectedApiKey) return '';
    if (!stateBusinessId) return '';
    
    return `<!-- SupportHub Widget -->
<script 
  src="${widgetUrl}/widget.js"
  data-api-key="${selectedApiKey}"
  data-business-id="${stateBusinessId}"
  async
  defer>
</script>`;
  };

  const handleCopyScript = async () => {
    const script = generateScriptTag();
    if (!script) {
      setError('Cannot generate script: Missing API key or business ID from authentication.');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy script:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = script;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWidgetUrlChange = (e) => {
    setWidgetUrl(e.target.value);
  };

  // Debug logging
  console.log('🔍 Widget Integration Debug:', {
    selectedApiKey,
    stateBusinessId,
    widgetUrl,
    showIframe: selectedApiKey && stateBusinessId
  });

  return (
    <div className="widget-integration-page">
      <div className="integration-header">
        <h1>Widget Integration</h1>
        <p>Embed your customized AI support widget into any website with just a few lines of code.</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {!stateBusinessId && (
        <div className="error-banner">
          <span className="error-icon">🔐</span>
          Business ID not found in authentication token. Please log in again to continue.
        </div>
      )}

      {stateBusinessId && (
        <div className="business-info-banner">
          <div className="business-info-content">
            <span className="business-info-label">Your Business ID (from JWT):</span>
            <span className="business-info-value">{stateBusinessId}</span>
          </div>
          <small className="business-info-note">This ID is automatically included in your widget integration script.</small>
        </div>
      )}

      <div className="integration-content">
        {/* Step 1: API Key Selection */}
        <div className="integration-step">
          <div className="step-header">
            <span className="step-number">1</span>
            <h2>Select Your API Key</h2>
          </div>
          
          <div className="step-content">
            {!stateBusinessId ? (
              <div className="no-keys-state">
                <p>Please log in to access API keys and widget integration.</p>
              </div>
            ) : isLoading ? (
              <div className="loading-state">Loading API keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="no-keys-state">
                <p>No active API keys found. You need an API key to integrate the widget.</p>
                <a href="/api-key-manager" className="create-key-link">
                  Create API Key →
                </a>
              </div>
            ) : (
              <div className="api-key-selector">
                <label htmlFor="apiKeySelect">Choose an API key:</label>
                <select 
                  id="apiKeySelect"
                  value={selectedApiKey} 
                  onChange={(e) => setSelectedApiKey(e.target.value)}
                  className="api-key-dropdown"
                >
                  <option value="">Select an API key...</option>
                  {apiKeys.map(key => {
                    // Additional safety check
                    if (!key || !key.keyValue) return null;
                    
                    return (
                      <option key={key.keyValue} value={key.keyValue}>
                        {key.keyValue.substring(0, 12)}... ({key.description || 'Unnamed Key'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Widget URL Configuration */}
        <div className="integration-step">
          <div className="step-header">
            <span className="step-number">3</span>
            <h2>Configure Widget Source</h2>
          </div>
          
          <div className="step-content">
            <div className="widget-url-config">
              <label htmlFor="widgetUrl">Widget URL:</label>
              <input
                id="widgetUrl"
                type="url"
                value={widgetUrl}
                onChange={handleWidgetUrlChange}
                placeholder="http://localhost:5175"
                className="widget-url-input"
              />
              <small className="url-help">
                This is the URL where your widget is hosted. For development, use localhost:5175.
              </small>
            </div>
          </div>
        </div>

        {/* Step 4: Integration Code */}
        <div className="integration-step">
          <div className="step-header">
            <span className="step-number">4</span>
            <h2>Copy Integration Code</h2>
          </div>
          
          <div className="step-content">
            {selectedApiKey ? (
              <div className="script-container">
                <div className="script-header">
                  <span className="script-label">HTML Script Tag</span>
                  <button 
                    onClick={handleCopyScript}
                    className={`copy-button ${copied ? 'copied' : ''}`}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <pre className="script-code">
                  <code>{generateScriptTag()}</code>
                </pre>
                <div className="script-instructions">
                  <p><strong>Instructions:</strong></p>
                  <ol>
                    <li>Copy the script tag above</li>
                    <li>Paste it just before the closing <code>&lt;/body&gt;</code> tag on your website</li>
                    <li>The widget will automatically appear on your site</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="no-key-selected">
                <p>Please select an API key above to generate the integration script.</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Advanced Configuration */}
        <div className="integration-step">
          <div className="step-header">
            <span className="step-number">5</span>
            <h2>Advanced Configuration</h2>
          </div>
          
          <div className="step-content">
            <div className="advanced-options">
              <h3>Optional Parameters</h3>
              <div className="config-table">
                <table>
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Description</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>data-position</code></td>
                      <td>Widget position on screen</td>
                      <td><code>bottom-right</code> or <code>bottom-left</code></td>
                    </tr>
                    <tr>
                      <td><code>data-theme</code></td>
                      <td>Color theme override</td>
                      <td><code>light</code> or <code>dark</code></td>
                    </tr>
                    <tr>
                      <td><code>data-auto-open</code></td>
                      <td>Auto-open widget on page load</td>
                      <td><code>true</code> or <code>false</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3>Example with Custom Parameters</h3>
              <pre className="example-code">
                <code>{`<script 
  src="${widgetUrl}/widget.js"
  data-api-key="${selectedApiKey || 'YOUR_API_KEY'}"
  data-business-id="${stateBusinessId || 'AUTO_FROM_JWT_TOKEN'}"
  data-position="bottom-left"
  data-theme="dark"
  data-auto-open="false"
  async
  defer>
</script>`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="integration-step">
          <div className="step-header">
            <span className="step-number">?</span>
            <h2>Troubleshooting</h2>
          </div>
          
          <div className="step-content">
            <div className="troubleshooting">
              <h3>Common Issues</h3>
              <div className="issue-item">
                <h4>Widget not appearing</h4>
                <ul>
                  <li>Check that the script tag is placed before <code>&lt;/body&gt;</code></li>
                  <li>Verify your API key is active and correct</li>
                  <li>Check browser console for any JavaScript errors</li>
                </ul>
              </div>
              
              <div className="issue-item">
                <h4>CORS errors</h4>
                <ul>
                  <li>Ensure your domain is added to the allowed origins list</li>
                  <li>Contact support if you need to add additional domains</li>
                </ul>
              </div>
              
              <div className="issue-item">
                <h4>Widget styling issues</h4>
                <ul>
                  <li>The widget uses isolated CSS to prevent conflicts</li>
                  <li>If positioning is incorrect, check for CSS conflicts with <code>z-index</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Live Widget Preview - Moved to bottom */}
        <div className="integration-step featured-preview" style={{ 
          marginTop: '30px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Header bar */}
          <div style={{
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>👁️</span>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '500' }}>Live Widget Preview</h2>
          </div>
          
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            padding: '16px',
            gap: '16px'
          }}>
            {/* Debug info bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#666'
            }}>
              <span>API Key: {selectedApiKey ? '✅' : '❌'}</span>
              <span>|</span>
              <span>Business ID: {stateBusinessId ? '✅' : '❌'}</span>
              <span>|</span>
              <span>URL: {widgetUrl}</span>
              <button 
                onClick={() => window.open(widgetUrl, '_blank')}
                style={{ 
                  marginLeft: 'auto',
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Test URL
              </button>
            </div>

            {/* Main preview container */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* Preview header */}
              <div style={{
                backgroundColor: '#1976d2',
                color: 'white',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px'
              }}>
                <span>🚀 Widget Preview</span>
                <button 
                  onClick={() => window.open(widgetUrl, '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Open in New Tab
                </button>
              </div>

              {/* Iframe container */}
              <div style={{ 
                position: 'relative',
                width: '100%',
                height: '100vh', // Full viewport height
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '8px'
              }}>
                <iframe
                  src={widgetUrl}
                  title="Widget Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation allow-popups allow-modals"
                  onError={(e) => {
                    console.error('❌ Iframe preview error:', e);
                    e.target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.innerHTML = `
                      <div style="padding: 40px; text-align: center; color: #d32f2f; background: white; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <h3>⚠️ Widget Preview Failed to Load</h3>
                        <p>Could not load widget from ${widgetUrl}</p>
                        <p>Please check if your widget server is running on port 5175</p>
                        <button onclick="window.open('${widgetUrl}', '_blank')" 
                                style="margin-top: 10px; padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                          Try Opening Directly
                        </button>
                      </div>
                    `;
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                />
                
                {/* Loading indicator */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  pointerEvents: 'none',
                  zIndex: 1000
                }}>
                  Loading from: {widgetUrl}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetIntegrationPage; 