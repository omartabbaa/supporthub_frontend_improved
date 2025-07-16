import React, { useState } from 'react';
import { apiBaseUrl } from '../services/ApiService';

const DeveloperSettings = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [apiUrl, setApiUrl] = useState(apiBaseUrl.getCurrent());

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleApiUrlChange = (e) => {
    setApiUrl(e.target.value);
  };

  const applyApiUrl = () => {
    apiBaseUrl.set(apiUrl);
    window.location.reload(); // Reload to apply changes
  };

  const resetApiUrl = () => {
    apiBaseUrl.reset();
    setApiUrl(apiBaseUrl.getCurrent());
    window.location.reload(); // Reload to apply changes
  };

  // Press Ctrl+Shift+D to toggle
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleVisibility();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="developer-settings">
      <h3>Developer Settings</h3>
      <div>
        <label>
          API Base URL:
          <input type="text" value={apiUrl} onChange={handleApiUrlChange} style={{width: '100%'}} />
        </label>
        <div>
          <button onClick={applyApiUrl}>Apply</button>
          <button onClick={resetApiUrl}>Reset to Default</button>
        </div>
      </div>
      <div>
        <p>Current environment: {window.location.hostname === 'localhost' ? 'Development' : 'Production'}</p>
        <p>Current API URL: {apiBaseUrl.getCurrent()}</p>
      </div>
    </div>
  );
};

export default DeveloperSettings; 