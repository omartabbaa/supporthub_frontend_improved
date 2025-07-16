import React, { useState, useEffect } from 'react';
import './WidgetPreview.css';

// Simple Icon component (can be expanded with an icon library)
const Icon = ({ name, style }) => (
  <span className="material-icons-outlined" style={style}>
    {name}
  </span>
);

const WidgetPreview = ({ config }) => {
  const [isOpen, setIsOpen] = useState(true); // Widget window is open by default in preview

  // Add Material Icons stylesheet link to the document head if not already present
  useEffect(() => {
    const iconFontLink = document.getElementById('material-icons-font');
    if (!iconFontLink) {
      const link = document.createElement('link');
      link.id = 'material-icons-font';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);


  const launcherStyle = {
    backgroundColor: config.primaryColor,
    borderRadius: config.widgetShape === 'rounded' ? '50%' : '8px',
    // Add more dynamic styles based on config
  };

  const launcherIconStyle = {
    color: config.secondaryColor,
    fontSize: '28px',
  };

  const widgetWindowStyle = {
    fontFamily: config.fontFamily,
    borderRadius: config.widgetShape === 'rounded' ? '15px' : '0px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    // Add more dynamic styles
  };

  const headerStyle = {
    backgroundColor: config.primaryColor,
    color: config.secondaryColor,
    borderTopLeftRadius: config.widgetShape === 'rounded' ? '15px' : '0px',
    borderTopRightRadius: config.widgetShape === 'rounded' ? '15px' : '0px',
  };
  
  const welcomeMessageStyle = {
    color: config.textColor,
  };

  const chatInputStyle = {
    borderColor: config.primaryColor,
    fontFamily: config.fontFamily,
  };

  const sendButtonStyle = {
    backgroundColor: config.primaryColor,
    color: config.secondaryColor,
  };


  return (
    <div className={`widget-preview-container ${config.widgetPosition} ${isOpen ? 'open' : 'closed'}`}>
      {!isOpen && (
        <div
          className="widget-launcher"
          style={launcherStyle}
          onClick={() => setIsOpen(true)}
          title="Open Chat Preview"
        >
          <Icon name={config.launcherIcon || 'chat_bubble'} style={launcherIconStyle} />
        </div>
      )}

      {isOpen && (
        <div className="widget-window" style={widgetWindowStyle}>
          <div className="widget-header" style={headerStyle}>
            <span>{config.headerText}</span>
            <button
              className="widget-close-button"
              onClick={() => setIsOpen(false)}
              style={{ 
                color: config.secondaryColor,
                fontSize: '18px',
                fontWeight: 'normal',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1',
                userSelect: 'none'
              }}
              title="Close Chat Preview"
            >
              ×
            </button>
          </div>
          <div className="widget-body">
            {config.showWelcomeMessage && config.welcomeMessage && (
              <div className="welcome-message" style={welcomeMessageStyle}>
                <p>{config.welcomeMessage}</p>
              </div>
            )}
            <div className="mock-chat-area">
              {/* Placeholder for chat messages */}
              <div className="message-bubble received">Hi! This is a preview.</div>
              <div className="message-bubble sent">Looks great!</div>
            </div>
          </div>
          <div className="widget-footer">
            <input type="text" placeholder="Type a message..." style={chatInputStyle} />
            <button className="send-button" style={sendButtonStyle}>
              <Icon name="send" style={{color: config.secondaryColor, fontSize: '20px'}}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetPreview; 