import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import WidgetProcessSidebar from './WidgetProcessSidebar';
import UserActionsSidebar from './UserActionsSidebar';
import { useUserContext } from '../context/LoginContext';
import { permissionWidgetConfigurationApi, setAuthToken } from '../services/ApiService';
import './UserLayout.css';

const UserLayout = () => {
  const { role, userId, stateBusinessId, token } = useUserContext();
  
  // Sidebar switcher state
  const [selectedSidebarType, setSelectedSidebarType] = useState('userActions'); // 'userActions' or 'widget'
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] = useState(true);
  const [hasWidgetAccess, setHasWidgetAccess] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  
  const toggleSecondarySidebar = () => {
    setIsSecondarySidebarVisible(!isSecondarySidebarVisible);
  };

  const switchToUserActions = () => {
    setSelectedSidebarType('userActions');
    if (!isSecondarySidebarVisible) {
      setIsSecondarySidebarVisible(true);
    }
  };

  const switchToWidget = () => {
    setSelectedSidebarType('widget');
    if (!isSecondarySidebarVisible) {
      setIsSecondarySidebarVisible(true);
    }
  };

  // Check if user has widget configuration access
  const checkWidgetAccess = async () => {
    if (!userId || !stateBusinessId || !token) {
      setHasWidgetAccess(false);
      setIsCheckingPermission(false);
      return;
    }

    // Admin always has access regardless of permission status
    if (role === 'ROLE_ADMIN') {
      setHasWidgetAccess(true);
      setIsCheckingPermission(false);
      return;
    }

    try {
      setAuthToken(token);
      const response = await permissionWidgetConfigurationApi.checkUserAccessForBusiness(userId, stateBusinessId);
      setHasWidgetAccess(response.data === true);
    } catch (error) {
      console.error('[UserLayout] Error checking widget access:', error);
      setHasWidgetAccess(false);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  // Check widget permissions when component mounts or dependencies change
  useEffect(() => {
    checkWidgetAccess();
  }, [userId, stateBusinessId, token, role]);

  // If user loses widget access and is currently on widget sidebar, switch to userActions
  useEffect(() => {
    if (!isCheckingPermission && !hasWidgetAccess && selectedSidebarType === 'widget') {
      setSelectedSidebarType('userActions');
    }
  }, [hasWidgetAccess, isCheckingPermission, selectedSidebarType]);

  // Calculate main content margin
  const getPrimaryWidth = () => 80; // Fixed narrow primary sidebar
  const getSecondaryWidth = () => isSecondarySidebarVisible ? 280 : 0;
  const getTotalSidebarWidth = () => getPrimaryWidth() + getSecondaryWidth();

  const renderSecondarySidebar = () => {
    if (!isSecondarySidebarVisible) return null;
    
    const commonProps = {
      isCollapsed: false,
      toggleSidebar: toggleSecondarySidebar,
      setActiveSidebarType: setSelectedSidebarType,
      isSecondaryContent: true
    };
    
    if (selectedSidebarType === 'userActions') {
      return <UserActionsSidebar {...commonProps} />;
    } else {
      return <WidgetProcessSidebar {...commonProps} />;
    }
  };

  return (
    <div className="sidebar-switcher-layout-container">
      {/* Mobile backdrop overlay */}
      <div 
        className={`mobile-sidebar-backdrop ${isSecondarySidebarVisible ? 'active' : ''}`}
        onClick={toggleSecondarySidebar}
      ></div>
      
      {/* Primary narrow sidebar - sidebar switcher */}
      <div className="primary-switcher-sidebar">
        <div className="switcher-header">
          <div className="switcher-logo">☰</div>
        </div>
        
        <div className="switcher-buttons">
          <button 
            onClick={switchToUserActions}
            className={`switcher-button ${selectedSidebarType === 'userActions' ? 'active' : ''}`}
            title="Business Management & Navigation"
          >
            <span className="switcher-icon">👥</span>
            <span className="switcher-label">Business</span>
          </button>
          
          {/* Widget button - only show if user has permission or is admin */}
          {(hasWidgetAccess || isCheckingPermission) && (
            <button 
              onClick={switchToWidget}
              className={`switcher-button ${selectedSidebarType === 'widget' ? 'active' : ''}`}
              title="Widget Configuration & Setup"
              disabled={isCheckingPermission}
            >
              <span className="switcher-icon">
                {isCheckingPermission ? '⏳' : '🔧'}
              </span>
              <span className="switcher-label">
                {isCheckingPermission ? 'Loading...' : 'Widget'}
              </span>
            </button>
          )}
        </div>
        
        <div className="switcher-footer">
          <button 
            onClick={toggleSecondarySidebar}
            className="collapse-toggle"
            title={isSecondarySidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            {isSecondarySidebarVisible ? '◀' : '▶'}
          </button>
        </div>
      </div>
      
      {/* Secondary content sidebar */}
      <div className={`secondary-content-sidebar ${isSecondarySidebarVisible ? 'visible' : 'hidden'}`}>
        {renderSecondarySidebar()}
      </div>
      
      {/* Main content area */}
      <main 
        className="main-content-area"
        style={{ 
          marginLeft: `${getTotalSidebarWidth()}px`,
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout; 