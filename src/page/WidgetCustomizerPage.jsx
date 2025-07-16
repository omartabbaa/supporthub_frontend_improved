import React, { useState, useEffect } from 'react';
import WidgetPreview from '../Components/WidgetPreview';
import './WidgetCustomizerPage.css';
import { widgetConfigurationsApi, setAuthToken } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';
import { useSidebarContext } from '../context/SidebarContext.jsx';

const WidgetCustomizerPage = () => {
  const { stateBusinessId, token } = useUserContext();
  const { setActiveSidebarType } = useSidebarContext();
  
  const initialConfig = {
    headerText: 'Chat with Support',
    welcomeMessage: 'Hello! How can we assist you today?',
    primaryColor: '#1976D2',
    secondaryColor: '#FFFFFF',
    textColor: '#333333',
    fontFamily: 'Roboto, Arial, sans-serif',
    widgetPosition: 'bottom-right',
    launcherIcon: 'chat_bubble',
    widgetShape: 'rounded',
    showWelcomeMessage: true,
  };

  const [widgetConfig, setWidgetConfig] = useState(initialConfig);
  const [persistedConfigId, setPersistedConfigId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      if (!stateBusinessId) {
        console.log("Business ID not available, cannot fetch widget config.");
        setWidgetConfig(initialConfig);
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      setError(null);
      try {
        const response = await widgetConfigurationsApi.getByBusinessId(stateBusinessId);
        if (response.data) {
          const fetched = response.data;
          setWidgetConfig({
            headerText: fetched.headerText || initialConfig.headerText,
            welcomeMessage: fetched.welcomeMessage || initialConfig.welcomeMessage,
            primaryColor: fetched.primaryColor || initialConfig.primaryColor,
            secondaryColor: fetched.secondaryColor || initialConfig.secondaryColor,
            textColor: fetched.textColor || initialConfig.textColor,
            fontFamily: fetched.fontFamily || initialConfig.fontFamily,
            widgetPosition: fetched.widgetPosition || initialConfig.widgetPosition,
            launcherIcon: fetched.launcherIcon || initialConfig.launcherIcon,
            widgetShape: fetched.widgetShape || initialConfig.widgetShape,
            showWelcomeMessage: typeof fetched.showWelcomeMessage === 'boolean' ? fetched.showWelcomeMessage : initialConfig.showWelcomeMessage,
          });
          setPersistedConfigId(fetched.id);
        } else {
          setWidgetConfig(initialConfig);
          setPersistedConfigId(null);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.log("No widget configuration found for this business. Using defaults.");
          setWidgetConfig(initialConfig);
          setPersistedConfigId(null);
        } else {
          console.error("Error fetching widget configuration:", err);
          setError("Failed to load widget settings. Please try again.");
          setWidgetConfig(initialConfig);
          setPersistedConfigId(null);
        }
      } finally {
        setIsFetching(false);
      }
    };

    if (token) {
      fetchConfig();
    } else {
      setIsFetching(false);
      setWidgetConfig(initialConfig);
    }
  }, [stateBusinessId, token]);

  useEffect(() => {
    setActiveSidebarType('widget');
  }, [setActiveSidebarType]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setWidgetConfig(prevConfig => ({
      ...prevConfig,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSuccessMessage('');
    setError('');
  };

  const handleSaveConfiguration = async () => {
    if (!stateBusinessId) {
      setError("Cannot save configuration: Business ID is missing.");
      return;
    }
    if (!token) {
      setError("Authentication required to save settings.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    const payload = {
      headerText: widgetConfig.headerText,
      welcomeMessage: widgetConfig.welcomeMessage,
      primaryColor: widgetConfig.primaryColor,
      secondaryColor: widgetConfig.secondaryColor,
      textColor: widgetConfig.textColor,
      fontFamily: widgetConfig.fontFamily,
      widgetPosition: widgetConfig.widgetPosition,
      launcherIcon: widgetConfig.launcherIcon,
      widgetShape: widgetConfig.widgetShape,
      showWelcomeMessage: widgetConfig.showWelcomeMessage,
    };

    try {
      let response;
      if (persistedConfigId) {
        response = await widgetConfigurationsApi.updateConfiguration(persistedConfigId, payload);
      } else {
        const createPayload = { ...payload, businessId: stateBusinessId };
        response = await widgetConfigurationsApi.createConfiguration(createPayload);
      }
      
      if (response.data) {
        setSuccessMessage("Widget configuration saved successfully!");
        if (!persistedConfigId && response.data.id) {
          setPersistedConfigId(response.data.id);
        }
      }

    } catch (err) {
      console.error("Error saving widget configuration:", err);
      let errorMessage = "Failed to save widget settings. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response && err.response.data && Array.isArray(err.response.data.errors)) {
        errorMessage = err.response.data.errors.map(e => e.defaultMessage || `${e.field}: ${e.code}`).join(', ');
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const commonFonts = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Georgia, serif',
    'Times New Roman, Times, serif',
    'Courier New, Courier, monospace',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
  ];

  if (isFetching) {
    return (
      <div className="widget-customizer-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading widget settings...</p>
      </div>
    );
  }

  return (
    <div className="widget-customizer-page">
      <div className="controls-panel">
        <h2>Customize Your AI Widget</h2>

        <div className="control-group">
          <h3>Branding & Colors</h3>
          <label htmlFor="primaryColor">Primary Color:</label>
          <input
            type="color"
            id="primaryColor"
            name="primaryColor"
            value={widgetConfig.primaryColor}
            onChange={handleInputChange}
          />

          <label htmlFor="secondaryColor">Secondary Color (Icons/Accents):</label>
          <input
            type="color"
            id="secondaryColor"
            name="secondaryColor"
            value={widgetConfig.secondaryColor}
            onChange={handleInputChange}
          />
          
          <label htmlFor="textColor">Text Color (in chat):</label>
          <input
            type="color"
            id="textColor"
            name="textColor"
            value={widgetConfig.textColor}
            onChange={handleInputChange}
          />
        </div>

        <div className="control-group">
          <h3>Text & Content</h3>
          <label htmlFor="headerText">Header Text:</label>
          <input
            type="text"
            id="headerText"
            name="headerText"
            value={widgetConfig.headerText}
            onChange={handleInputChange}
            placeholder="e.g., Chat with Us"
          />

          <label htmlFor="welcomeMessage">Welcome Message:</label>
          <textarea
            id="welcomeMessage"
            name="welcomeMessage"
            value={widgetConfig.welcomeMessage}
            onChange={handleInputChange}
            placeholder="e.g., Hi there! How can we help?"
            rows="3"
          />
           <label>
            <input
              type="checkbox"
              name="showWelcomeMessage"
              checked={widgetConfig.showWelcomeMessage}
              onChange={handleInputChange}
            />
            Show Welcome Message
          </label>
        </div>

        <div className="control-group">
          <h3>Appearance & Layout</h3>
          <label htmlFor="fontFamily">Font Family:</label>
          <select
            id="fontFamily"
            name="fontFamily"
            value={widgetConfig.fontFamily}
            onChange={handleInputChange}
          >
            {commonFonts.map(font => (
              <option key={font} value={font}>{font.split(',')[0]}</option>
            ))}
          </select>

          <label htmlFor="widgetPosition">Widget Position:</label>
          <select
            id="widgetPosition"
            name="widgetPosition"
            value={widgetConfig.widgetPosition}
            onChange={handleInputChange}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>

          <label htmlFor="widgetShape">Widget Shape:</label>
          <select
            id="widgetShape"
            name="widgetShape"
            value={widgetConfig.widgetShape}
            onChange={handleInputChange}
          >
            <option value="rounded">Rounded</option>
            <option value="square">Square</option>
          </select>
        </div>
        
        <div className="control-group">
            <h3>Launcher</h3>
            <label htmlFor="launcherIcon">Launcher Icon (Material Icon Name):</label>
            <input 
                type="text"
                id="launcherIcon"
                name="launcherIcon"
                value={widgetConfig.launcherIcon}
                onChange={handleInputChange}
                placeholder="e.g., chat, question_answer"
            />
            <small>Uses Google Material Icons. Example: 'chat_bubble', 'support_agent'</small>
        </div>

        <button 
          type="button" 
          className="save-widget-config-button"
          onClick={handleSaveConfiguration}
          disabled={isLoading || isFetching}
        >
          {isLoading ? 'Saving...' : 'Save Widget Configuration'}
        </button>
        {error && <p className="save-note error-note" style={{color: 'red', marginTop: '10px'}}>{error}</p>}
        {successMessage && <p className="save-note success-note" style={{color: 'green', marginTop: '10px'}}>{successMessage}</p>}
        {!error && !successMessage && !isLoading && <p className="save-note">(Customize your widget and click save)</p>}

      </div>

      <div className="preview-panel">
        <h3>Live Preview</h3>
        <div className="preview-area">
          <WidgetPreview config={widgetConfig} />
        </div>
      </div>
    </div>
  );
};

export default WidgetCustomizerPage; 