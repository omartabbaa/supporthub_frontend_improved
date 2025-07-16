import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { users as usersApi, permissionWidgetConfigurationApi, setAuthToken } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';
import Tooltip from '../Components/Tooltip';
import './ManageWidgetAgentsPage.css';

const ManageWidgetAgentsPage = () => {
  const { token, stateBusinessId, userId: currentUserId, role } = useUserContext();
  const navigate = useNavigate();
  
  const [allBusinessUsers, setAllBusinessUsers] = useState([]);
  const [widgetPermissions, setWidgetPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState({}); // Track which user permissions are being updated
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [isSearching, setIsSearching] = useState(false);

  console.log('[ManageWidgetAgentsPage] Component rendered', {
    stateBusinessId,
    currentUserId,
    role,
    tokenExists: !!token
  });

  // Check if user has permission to manage widget configurations
  const canManageWidgetConfig = useMemo(() => {
    return role === 'ROLE_ADMIN';
  }, [role]);

  const fetchData = useCallback(async () => {
    if (!stateBusinessId || !token) {
      setIsLoading(false);
      console.log('[ManageWidgetAgentsPage] FetchData skipped: missing business ID or token');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      setAuthToken(token);
      
      // Fetch all business users
      let usersResponse;
      try {
        usersResponse = await usersApi.getByBusinessId(stateBusinessId);
      } catch (error) {
        console.log('[ManageWidgetAgentsPage] getByBusinessId not available, trying alternative method');
        usersResponse = await usersApi.getAll();
        if (usersResponse.data) {
          usersResponse.data = usersResponse.data.filter(user => 
            user.businessId === stateBusinessId || user.businessId === parseInt(stateBusinessId)
          );
        }
      }
      
      // Fetch widget configuration permissions for this business
      const permissionsResponse = await permissionWidgetConfigurationApi.getByBusinessId(stateBusinessId);
      
      console.log('[ManageWidgetAgentsPage] Users response:', usersResponse.data);
      console.log('[ManageWidgetAgentsPage] Permissions response:', permissionsResponse.data);

      setAllBusinessUsers(usersResponse.data || []);
      setWidgetPermissions(permissionsResponse.data || []);
    } catch (err) {
      console.error('[ManageWidgetAgentsPage] Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load user or permission data. Please try again.');
      setAllBusinessUsers([]);
      setWidgetPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [stateBusinessId, token]);

  useEffect(() => {
    if (!canManageWidgetConfig) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [fetchData, canManageWidgetConfig, navigate]);

  const handleTogglePermission = async (user, currentCanAccess) => {
    setIsUpdating(prev => ({ ...prev, [user.userId]: true }));
    setError('');
    setSuccessMessage('');

    console.log(`[ManageWidgetAgentsPage] Toggling widget config permission for user ${user.userId} (${user.userName}). Current canAccess: ${currentCanAccess}`);

    try {
      setAuthToken(token);
      
      // Use the toggle endpoint
      await permissionWidgetConfigurationApi.toggleAccess(user.userId, stateBusinessId);
      
      // Refresh permissions
      const permissionsResponse = await permissionWidgetConfigurationApi.getByBusinessId(stateBusinessId);
      setWidgetPermissions(permissionsResponse.data || []);
      
      setSuccessMessage(`${user.userName || user.name}'s widget configuration permissions updated successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      console.log(`[ManageWidgetAgentsPage] Permission for user ${user.userId} updated successfully`);
    } catch (err) {
      console.error(`[ManageWidgetAgentsPage] Error updating permission for user ${user.userId}:`, err);
      setError(err.response?.data?.message || `Failed to update permission for ${user.userName || user.name}.`);
    } finally {
      setIsUpdating(prev => ({ ...prev, [user.userId]: false }));
    }
  };

  // Enhanced search and filtering logic
  const combinedUserData = useMemo(() => {
    setIsSearching(true);
    
    // First, filter users to only include SUPPORT_AGENT or ROLE_SUPPORT_AGENT roles
    const expertUsers = allBusinessUsers.filter(user => 
      user.role === 'SUPPORT_AGENT' || user.role === 'ROLE_SUPPORT_AGENT'
    );
    
    const baseUserData = expertUsers.map(user => {
      const permission = widgetPermissions.find(p => p.userId === user.userId);
      return {
        ...user,
        canAccess: permission ? permission.canAccess : false,
        permissionId: permission ? permission.permissionWidgetConfigurationId : null,
      };
    });

    // Apply search filter first
    let filteredData = baseUserData;
    if (searchFilter === 'active') {
      filteredData = baseUserData.filter(user => user.canAccess);
    } else if (searchFilter === 'inactive') {
      filteredData = baseUserData.filter(user => !user.canAccess);
    }

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(user => {
        const nameMatch = user.userName?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const namePartsMatch = user.userName?.toLowerCase().split(' ').some(part => part.startsWith(searchLower));
        const emailPartsMatch = user.email?.toLowerCase().split('@')[0].includes(searchLower);
        
        return nameMatch || emailMatch || namePartsMatch || emailPartsMatch;
      });
    }

    setTimeout(() => setIsSearching(false), 100);
    return filteredData;
  }, [allBusinessUsers, widgetPermissions, searchTerm, searchFilter]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchFilter('all');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (searchTerm) {
        clearSearch();
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const activeAgentsCount = widgetPermissions.filter(permission => permission.canAccess).length;

  // Highlight matching text in search results
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  // Get expert users count for filter options
  const expertUsersCount = allBusinessUsers.filter(user => 
    user.role === 'SUPPORT_AGENT' || user.role === 'ROLE_SUPPORT_AGENT'
  ).length;

  // Quick filter options
  const filterOptions = [
    { value: 'all', label: 'All Expert Users', count: expertUsersCount },
    { value: 'active', label: 'Can Manage Widget', count: activeAgentsCount },
    { value: 'inactive', label: 'Cannot Manage Widget', count: expertUsersCount - activeAgentsCount }
  ];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="loading-skeleton-widget-agents">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-user-item">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-name"></div>
            <div className="skeleton-email"></div>
          </div>
          <div className="skeleton-toggle"></div>
        </div>
      ))}
    </div>
  );

  if (!canManageWidgetConfig) {
    return null;
  }

  return (
    <div className="manage-widget-agents-page">
      <div className="page-header">
        <div className="header-content">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
            aria-label="Go back"
          >
            ← Back
          </button>
          <div className="title-section">
            <h1>Manage Widget Configuration Access</h1>
            <p className="subtitle">
              Grant or revoke permissions for expert agents to manage widget configurations
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{activeAgentsCount}</span>
              <span className="stat-label">Can Manage Widget</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{expertUsersCount}</span>
              <span className="stat-label">Expert Users</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
            <button 
              className="retry-button"
              onClick={fetchData}
              disabled={isLoading}
            >
              Retry
            </button>
          </div>
        )}

        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-container">
              <div className="search-input-wrapper">
                <div className="search-icon-container">
                  <span className="search-icon" aria-hidden="true">
                    {isSearching ? (
                      <div className="search-spinner"></div>
                    ) : (
                      "🔍"
                    )}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck="false"
                />
                {searchTerm && (
                  <button 
                    className="clear-search-button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>
              
              <div className="search-hint">
                Press <kbd>ESC</kbd> to clear search
              </div>
            </div>

            {/* Quick Filters */}
            <div className="search-filters">
              <span className="filter-label">Filter:</span>
              <div className="filter-buttons">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    className={`filter-button ${searchFilter === option.value ? 'active' : ''}`}
                    onClick={() => setSearchFilter(option.value)}
                    disabled={isLoading}
                  >
                    {option.label}
                    <span className="filter-count">{option.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Info */}
            {(searchTerm || searchFilter !== 'all') && (
              <div className="search-results-info">
                <span className="results-count">
                  {combinedUserData.length} user{combinedUserData.length !== 1 ? 's' : ''} found
                </span>
                {searchTerm && (
                  <span className="search-term">
                    for "<strong>{searchTerm}</strong>"
                  </span>
                )}
                {searchFilter !== 'all' && (
                  <span className="active-filter">
                    in {filterOptions.find(f => f.value === searchFilter)?.label.toLowerCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="users-section">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {combinedUserData.length === 0 && !error && (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    {searchTerm || searchFilter !== 'all' ? '🔍' : '👥'}
                  </div>
                  <h3>
                    {searchTerm || searchFilter !== 'all' ? 'No matching users found' : 'No users found'}
                  </h3>
                  <p>
                    {searchTerm 
                      ? `No users match "${searchTerm}". Try adjusting your search terms or clearing filters.`
                      : searchFilter !== 'all'
                      ? `No users in the ${filterOptions.find(f => f.value === searchFilter)?.label.toLowerCase()} category.`
                      : "No expert agents are available in this organization."
                    }
                  </p>
                  {(searchTerm || searchFilter !== 'all') && (
                    <button className="clear-search-button-alt" onClick={clearSearch}>
                      Clear search and filters
                    </button>
                  )}
                </div>
              )}

              {combinedUserData.length > 0 && (
                <div className="users-list">
                  <div className="list-header">
                    <h3>
                      {searchFilter === 'all' ? 'Expert Agents' : 
                       filterOptions.find(f => f.value === searchFilter)?.label}
                    </h3>
                    <span className="total-count">{combinedUserData.length} users</span>
                  </div>
                  
                  <div className="users-grid">
                    {combinedUserData.map(user => (
                      <div key={user.userId} className={`user-card ${user.canAccess ? 'has-permission' : ''}`}>
                        <div className="user-avatar-section">
                          <div className="user-avatar">
                            {getInitials(user.userName || user.name)}
                          </div>
                          {user.canAccess && (
                            <div className="permission-indicator" title="Can manage widget configuration">
                              <span aria-hidden="true">✓</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="user-info-section">
                          <div className="user-name">
                            {highlightMatch(user.userName || user.name || 'Unknown User', searchTerm)}
                          </div>
                          <div className="user-email">
                            {highlightMatch(user.email, searchTerm)}
                          </div>
                          {user.canAccess && (
                            <div className="user-status active">
                              Can Manage Widget
                            </div>
                          )}
                        </div>

                        <div className="user-actions-section">
                          <div className="permission-toggle-container">
                            <span className="toggle-label">Widget Access</span>
                            <Tooltip 
                              text={user.canAccess 
                                ? `Remove ${user.userName || user.name}'s ability to manage widget configurations` 
                                : `Grant ${user.userName || user.name} the ability to manage widget configurations`
                              } 
                            >
                              <button
                                className={`permission-toggle ${user.canAccess ? "active" : ""} ${isUpdating[user.userId] ? "updating" : ""}`}
                                onClick={() => handleTogglePermission(user, user.canAccess)}
                                aria-pressed={user.canAccess}
                                aria-label={`${user.canAccess ? 'Remove' : 'Grant'} widget configuration permission for ${user.userName || user.name}`}
                                disabled={isLoading || isUpdating[user.userId]}
                              >
                                <div className="toggle-track">
                                  <div className="toggle-thumb">
                                    {isUpdating[user.userId] && (
                                      <div className="updating-spinner" aria-hidden="true"></div>
                                    )}
                                  </div>
                                </div>
                                <span className="sr-only">
                                  {user.canAccess ? 'Enabled' : 'Disabled'}
                                </span>
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageWidgetAgentsPage; 