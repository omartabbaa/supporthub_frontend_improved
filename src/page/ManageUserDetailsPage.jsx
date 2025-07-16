import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { users as usersApi, setAuthToken } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';

import './ManageUserDetailsPage.css';

const ManageUserDetailsPage = () => {
  const { token, stateBusinessId, userId: currentUserId, role } = useUserContext();
  const navigate = useNavigate();
  
  const [allBusinessUsers, setAllBusinessUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'completed', 'incomplete'
  const [isSearching, setIsSearching] = useState(false);

  console.log('[ManageUserDetailsPage] Component rendered', {
    stateBusinessId,
    currentUserId,
    role,
    tokenExists: !!token
  });

  // Check if user has permission to manage user details (only admins)
  const canManageUserDetails = useMemo(() => {
    return role === 'ROLE_ADMIN';
  }, [role]);

  const fetchData = useCallback(async () => {
    if (!stateBusinessId || !token) {
      setIsLoading(false);
      console.log('[ManageUserDetailsPage] FetchData skipped: missing business ID or token');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      setAuthToken(token);
      
      // Fetch users with ROLE_USER or USER role and should_update_user_details = false
      const usersResponse = await usersApi.getUsersByBusinessIdWithRoleAndUpdateStatus(stateBusinessId);
      
      console.log('[ManageUserDetailsPage] Users response:', usersResponse.data);

      setAllBusinessUsers(usersResponse.data || []);
    } catch (err) {
      console.error('[ManageUserDetailsPage] Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load user data. Please try again.');
      setAllBusinessUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [stateBusinessId, token]);

  useEffect(() => {
    if (!canManageUserDetails) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [fetchData, canManageUserDetails, navigate]);



  // Enhanced search and filtering logic
  const combinedUserData = useMemo(() => {
    setIsSearching(true);
    
    // Backend already filters users with ROLE_USER or USER roles with shouldUpdateUserDetails = false
    let filteredData = allBusinessUsers;
    
    // Apply search filter first
    if (searchFilter === 'completed') {
      // Users who have completed their profiles (have name and email filled)
      filteredData = allBusinessUsers.filter(user => 
        user.name && user.email && user.name.trim().length > 0
      );
    } else if (searchFilter === 'incomplete') {
      // Users who have incomplete profiles
      filteredData = allBusinessUsers.filter(user => 
        !user.name || user.name.trim().length === 0
      );
    }

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(user => {
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const namePartsMatch = user.name?.toLowerCase().split(' ').some(part => part.startsWith(searchLower));
        const emailPartsMatch = user.email?.toLowerCase().split('@')[0].includes(searchLower);
        
        return nameMatch || emailMatch || namePartsMatch || emailPartsMatch;
      });
    }

    setTimeout(() => setIsSearching(false), 100);
    return filteredData;
  }, [allBusinessUsers, searchTerm, searchFilter]);

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

  // Get counts for filter options - backend already filters users with ROLE_USER/USER and shouldUpdateUserDetails = false
  const regularUsersCount = allBusinessUsers.length;

  const completedProfilesCount = allBusinessUsers.filter(user => 
    user.name && user.email && user.name.trim().length > 0
  ).length;

  const incompleteProfilesCount = regularUsersCount - completedProfilesCount;

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

  // Quick filter options
  const filterOptions = [
    { value: 'all', label: 'All Regular Users', count: regularUsersCount },
    { value: 'completed', label: 'Complete Profiles', count: completedProfilesCount },
    { value: 'incomplete', label: 'Incomplete Profiles', count: incompleteProfilesCount }
  ];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="loading-skeleton-user-details">
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

  if (!canManageUserDetails) {
    return null;
  }

  return (
    <div className="manage-user-details-page">
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
            <h1>Regular Users Overview</h1>
            <p className="subtitle">
              View regular users who don't have profile completion requirements
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{completedProfilesCount}</span>
              <span className="stat-label">Complete Profiles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{regularUsersCount}</span>
              <span className="stat-label">Regular Users</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
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
                      : "No regular users with incomplete profile requirements are available in this organization."
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
                      {searchFilter === 'all' ? 'Regular Users' : 
                       filterOptions.find(f => f.value === searchFilter)?.label}
                    </h3>
                    <span className="total-count">{combinedUserData.length} users</span>
                  </div>
                  
                  <div className="users-grid">
                    {combinedUserData.map(user => (
                      <div key={user.userId} className={`user-card ${user.name && user.name.trim().length > 0 ? 'complete-profile' : 'incomplete-profile'}`}>
                        <div className="user-avatar-section">
                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>
                          {user.name && user.name.trim().length > 0 && (
                            <div className="profile-indicator" title="Profile is complete">
                              <span aria-hidden="true">✓</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="user-info-section">
                          <div className="user-name">
                            {highlightMatch(user.name || 'Unknown User', searchTerm)}
                          </div>
                          <div className="user-email">
                            {highlightMatch(user.email, searchTerm)}
                          </div>
                          <div className="user-details">
                            <span className="user-role">{user.role === 'ROLE_USER' ? 'User' : 'Regular User'}</span>
                            {user.name && user.name.trim().length > 0 ? (
                              <div className="user-status complete">
                                Profile Complete
                              </div>
                            ) : (
                              <div className="user-status incomplete">
                                Profile Incomplete
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="user-actions-section">
                          <div className="user-id-info">
                            <span className="user-id-label">User ID:</span>
                            <span className="user-id-value">{user.userId}</span>
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

export default ManageUserDetailsPage; 