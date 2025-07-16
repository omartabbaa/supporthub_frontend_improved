import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { users as usersApi, permissions as permissionsApi, agentInvitations as invitationsApi, setAuthToken } from '../services/ApiService';
import './ManageProjectAgentsModal.css';
import Tooltip from './Tooltip';
import { useUserContext } from '../context/LoginContext';

const ManageProjectAgentsModal = ({ 
  projectId,
  projectName,
  departmentId,
  businessId,
  onClose,
  onAgentsUpdated,
  helpModeEnabled
}) => {
  const { token } = useUserContext();

  const [allBusinessUsers, setAllBusinessUsers] = useState([]);
  const [projectPermissions, setProjectPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState({}); // Track which user permissions are being updated
  const [isUpdatingAny, setIsUpdatingAny] = useState(false); // Track if any permissions are being updated
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [isSearching, setIsSearching] = useState(false);

  // New state for tabs and invitations
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'invite'
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState({});
  
  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'ROLE_USER'
  });
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  console.log(`[MPAM ${projectId}] Rendering.`, {
    projectId,
    projectName,
    departmentId,
    businessId,
    props: { projectId, projectName, departmentId, businessId, onClose, helpModeEnabled }
  });

  const fetchData = useCallback(async () => {
    if (!projectId || !departmentId || !businessId || !token) {
      setIsLoading(false);
      console.log(`[MPAM ${projectId}] FetchData skipped: missing IDs or token.`, { projectId, departmentId, businessId, tokenExists: !!token });
      return;
    }
    setIsLoading(true);
    setError('');
    console.log(`[MPAM ${projectId}] Fetching data. BusinessId for users: ${businessId}`);
    try {
      setAuthToken(token);
      
      // Try alternative method if getByBusinessId doesn't exist
      let usersResponse;
      try {
        usersResponse = await usersApi.getByBusinessId(businessId);
      } catch (error) {
        // Fallback: try to get all users and filter by business
        console.log('getByBusinessId not available, trying alternative method');
        usersResponse = await usersApi.getAll();
        // Filter by businessId if the response contains business information
        if (usersResponse.data) {
          usersResponse.data = usersResponse.data.filter(user => 
            user.businessId === businessId || user.businessId === parseInt(businessId)
          );
        }
      }
      
      const permissionsResponse = await permissionsApi.getByProjectId(projectId);
      
      console.log(`[MPAM ${projectId}] Users response:`, usersResponse.data);
      console.log(`[MPAM ${projectId}] Permissions response:`, permissionsResponse.data);

      setAllBusinessUsers(usersResponse.data || []);
      setProjectPermissions(permissionsResponse.data || []);
    } catch (err) {
      console.error(`[MPAM ${projectId}] Error fetching data:`, err);
      setError(err.response?.data?.message || 'Failed to load user or permission data. Please try again.');
      setAllBusinessUsers([]);
      setProjectPermissions([]);
    } finally {
      setIsLoading(false);
      console.log(`[MPAM ${projectId}] Finished fetching data. Loading: false`);
    }
  }, [projectId, departmentId, businessId, token]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!businessId || !token) return;
    
    setIsLoadingInvitations(true);
    try {
      setAuthToken(token);
      const response = await invitationsApi.getByBusiness(businessId);
      setPendingInvitations(response.data || []);
      console.log('[MPAM] Fetched pending invitations:', response.data);
    } catch (err) {
      console.error('[MPAM] Error fetching invitations:', err);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [businessId, token]);

  useEffect(() => {
    fetchData();
    fetchPendingInvitations();
  }, [fetchData, fetchPendingInvitations]);

  const handleTogglePermission = async (user, currentCanAnswer, existingPermissionId) => {
    setIsUpdating(prev => ({ ...prev, [user.userId]: true }));
    setIsUpdatingAny(true); // Set flag that permissions are being updated
    setError('');
    setSuccessMessage('');
    const newCanAnswer = !currentCanAnswer;
    console.log(`[MPAM ${projectId}] Toggling permission for user ${user.userId} (${user.userName}). New canAnswer: ${newCanAnswer}. PermissionId: ${existingPermissionId}`);

    const permissionPayload = {
      userId: user.userId,
      projectId: projectId,
      departmentId: departmentId,
      canAnswer: newCanAnswer,
    };

    try {
      setAuthToken(token);
      if (existingPermissionId) {
        console.log(`[MPAM ${projectId}] Patching permission ${existingPermissionId}`);
        await permissionsApi.patch(existingPermissionId, permissionPayload);
      } else {
        console.log(`[MPAM ${projectId}] Creating new permission`);
        await permissionsApi.create(permissionPayload);
      }
      const permissionsResponse = await permissionsApi.getByProjectId(projectId);
      setProjectPermissions(permissionsResponse.data || []);
      
      // Show success message
      setSuccessMessage(`${user.userName || user.name}'s permissions updated successfully`);
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      
      // Notify parent component about the permission update immediately
      console.log(`[MPAM ${projectId}] 🚨 Calling onAgentsUpdated callback immediately...`);
      if (onAgentsUpdated) {
        try {
          console.log(`[MPAM ${projectId}] 🎯 onAgentsUpdated callback exists, calling it now`);
          // Call onAgentsUpdated immediately without delay
          await onAgentsUpdated();
          console.log(`[MPAM ${projectId}] ✅ onAgentsUpdated callback completed successfully`);
        } catch (error) {
          console.error(`[MPAM ${projectId}] ❌ Error in onAgentsUpdated callback:`, error);
        }
      } else {
        console.warn(`[MPAM ${projectId}] ⚠️ onAgentsUpdated callback not provided`);
      }
      
      console.log(`[MPAM ${projectId}] Permission for user ${user.userId} updated successfully. New permissions:`, permissionsResponse.data);
    } catch (err) {
      console.error(`[MPAM ${projectId}] Error updating permission for user ${user.userId}:`, err);
      setError(err.response?.data?.message || `Failed to update permission for ${user.userName || user.name}.`);
    } finally {
      setIsUpdating(prev => ({ ...prev, [user.userId]: false }));
      
      // Check if any other permissions are still being updated
      setIsUpdating(current => {
        const stillUpdating = Object.values(current).some(updating => updating);
        setIsUpdatingAny(stillUpdating);
        return current;
      });
      
      console.log(`[MPAM ${projectId}] Finished toggling permission. Loading: false`);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    
    if (!inviteForm.email || !inviteForm.name) {
      setError('Email and name are required');
      return;
    }

    setIsSubmittingInvite(true);
    setError('');
    
    try {
      setAuthToken(token);
      
      const invitationData = {
        email: inviteForm.email.trim(),
        name: inviteForm.name.trim(),
        role: inviteForm.role,
        businessId: parseInt(businessId),
        departmentIds: [parseInt(departmentId)], // Associate with current department
        permissions: ['CAN_ANSWER'] // Default permission
      };

      console.log('[MPAM] Sending invitation:', invitationData);
      
      await invitationsApi.create(invitationData);
      
      setSuccessMessage(`Invitation sent to ${inviteForm.email} successfully!`);
      setInviteForm({ email: '', name: '', role: 'ROLE_USER' });
      
      // Refresh pending invitations
      await fetchPendingInvitations();
      
      // Notify parent component about the invitation
      if (onAgentsUpdated) {
        onAgentsUpdated();
      }
      
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      console.error('[MPAM] Error sending invitation:', err);
      setError(err.response?.data?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCancelInvitation = async (tokenId, email) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }

    setInvitationLoading(prev => ({ ...prev, [tokenId]: true }));
    
    try {
      setAuthToken(token);
      await invitationsApi.cancel(tokenId);
      
      setSuccessMessage('Invitation cancelled successfully');
      await fetchPendingInvitations();
      
      // Notify parent component about the cancellation
      if (onAgentsUpdated) {
        onAgentsUpdated();
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('[MPAM] Error cancelling invitation:', err);
      setError(err.response?.data?.message || 'Failed to cancel invitation');
    } finally {
      setInvitationLoading(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  const handleResendInvitation = async (tokenId, email) => {
    setInvitationLoading(prev => ({ ...prev, [tokenId]: true }));
    
    try {
      setAuthToken(token);
      await invitationsApi.resend(tokenId);
      
      setSuccessMessage(`Invitation resent to ${email} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('[MPAM] Error resending invitation:', err);
      setError(err.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setInvitationLoading(prev => ({ ...prev, [tokenId]: false }));
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
      const permission = projectPermissions.find(p => p.userId === user.userId && p.projectId === projectId);
      return {
        ...user,
        canAnswer: permission ? permission.canAnswer : false,
        permissionId: permission ? permission.permissionId : null,
      };
    });

    // Apply search filter first
    let filteredData = baseUserData;
    if (searchFilter === 'active') {
      filteredData = baseUserData.filter(user => user.canAnswer);
    } else if (searchFilter === 'inactive') {
      filteredData = baseUserData.filter(user => !user.canAnswer);
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

    setTimeout(() => setIsSearching(false), 100); // Simulate search delay
    return filteredData;
  }, [allBusinessUsers, projectPermissions, projectId, searchTerm, searchFilter]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchFilter('all');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (searchTerm) {
        clearSearch();
      } else {
        onClose();
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get expert users count and active agents count
  const expertUsers = allBusinessUsers.filter(user => 
    user.role === 'SUPPORT_AGENT' || user.role === 'ROLE_SUPPORT_AGENT'
  );
  
  const activeAgentsCount = expertUsers
    .map(user => projectPermissions.find(p => p.userId === user.userId && p.projectId === projectId))
    .filter(permission => permission?.canAnswer).length;

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
    { value: 'all', label: 'All Expert Agents', count: expertUsers.length },
    { value: 'active', label: 'Active Agents', count: activeAgentsCount },
    { value: 'inactive', label: 'Inactive', count: expertUsers.length - activeAgentsCount }
  ];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="loading-skeleton-mpam">
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <>
      <div className="modal-header-mpam">
        <div className="modal-title-section">
          <h2>Manage Agents</h2>
          <div className="project-info">
            <span className="project-name">{projectName}</span>
            <div className="agents-count-badge">
              {activeAgentsCount} active agent{activeAgentsCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button 
          onClick={async () => {
            console.log(`[MPAM ${projectId}] Close button clicked.`);
            
            // Wait for any pending permission updates to complete
            if (isUpdatingAny) {
              console.log(`[MPAM ${projectId}] Waiting for pending permission updates to complete...`);
              // Wait for isUpdatingAny to become false
              while (isUpdatingAny) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              console.log(`[MPAM ${projectId}] All permission updates completed.`);
            }
            
            // Trigger a final refresh to ensure parent has latest data
            if (onAgentsUpdated) {
              console.log(`[MPAM ${projectId}] Triggering final refresh before closing via X button...`);
              try {
                await onAgentsUpdated();
                console.log(`[MPAM ${projectId}] Final refresh completed successfully via X button`);
              } catch (error) {
                console.error(`[MPAM ${projectId}] Error in final refresh:`, error);
              }
            }
            
            // Now close the modal
            console.log(`[MPAM ${projectId}] Closing modal via X button...`);
            if (onClose) onClose();
          }} 
          className="modal-close-button-mpam"
          aria-label="Close manage agents modal"
          disabled={isUpdatingAny}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation-mpam">
        <button 
          className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Current Agents
          <span className="tab-count">{activeAgentsCount}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          Invite Agents
          <span className="tab-count">{pendingInvitations.length}</span>
        </button>
      </div>

      <div className="modal-body-mpam">
        {/* Success Message */}
        {successMessage && (
          <div className="success-message-mpam">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message-mpam">
            <span className="error-icon">⚠</span>
            {error}
            <button 
              className="retry-button"
              onClick={activeTab === 'current' ? fetchData : fetchPendingInvitations}
              disabled={isLoading || isLoadingInvitations}
            >
              Retry
            </button>
          </div>
        )}

        {/* Current Agents Tab */}
        {activeTab === 'current' && (
          <>
            {/* Enhanced Search Section */}
            <div className="search-section-mpam">
              <div className="search-container-enhanced">
                {/* Search Input */}
                <div className="search-input-container">
                  <div className="search-input-wrapper-enhanced">
                    <div className="search-icon-container">
                      <span className="search-icon-enhanced" aria-hidden="true">
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
                      className="search-input-enhanced"
                      disabled={isLoading}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {searchTerm && (
                      <button 
                        className="clear-search-button-enhanced"
                        onClick={clearSearch}
                        aria-label="Clear search"
                        type="button"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Search shortcut hint */}
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
                <div className="search-results-container">
                  {(searchTerm || searchFilter !== 'all') && (
                    <div className="search-results-info-enhanced">
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
            </div>

            {/* Users List */}
            <div className="users-section-mpam">
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  {combinedUserData.length === 0 && !error && (
                    <div className="empty-state-mpam">
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
                      : "No expert agents are available in this organization, or permissions data couldn't be loaded."
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
                    <div className="users-list-mpam">
                      <div className="list-header">
                        <h3>
                          {searchFilter === 'all' ? 'Expert Agents' : 
                           filterOptions.find(f => f.value === searchFilter)?.label}
                        </h3>
                        <span className="total-count">{combinedUserData.length} users</span>
                      </div>
                      
                      <div className="users-grid">
                        {combinedUserData.map(user => (
                          <div key={user.userId} className={`user-card-mpam ${user.canAnswer ? 'has-permission' : ''}`}>
                            <div className="user-avatar-section">
                              <div className="user-avatar">
                                {getInitials(user.userName || user.name)}
                              </div>
                              {user.canAnswer && (
                                <div className="permission-indicator" title="Can answer questions">
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
                              {user.canAnswer && (
                                <div className="user-status active">
                                  Active Agent
                                </div>
                              )}
                            </div>

                            <div className="user-actions-section">
                              <div className="permission-toggle-container">
                                <span className="toggle-label">Can Answer</span>
                                <Tooltip 
                                  text={user.canAnswer 
                                    ? `Remove ${user.userName || user.name}'s ability to answer questions for this topic` 
                                    : `Grant ${user.userName || user.name} the ability to answer questions for this topic`
                                  } 
                                >
                                  <button
                                    className={`permission-toggle-mpam ${user.canAnswer ? "active" : ""} ${isUpdating[user.userId] ? "updating" : ""}`}
                                    onClick={() => handleTogglePermission(user, user.canAnswer, user.permissionId)}
                                    aria-pressed={user.canAnswer}
                                    aria-label={`${user.canAnswer ? 'Remove' : 'Grant'} answer permission for ${user.userName || user.name}`}
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
                                      {user.canAnswer ? 'Enabled' : 'Disabled'}
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
          </>
        )}

        {/* Invite Agents Tab */}
        {activeTab === 'invite' && (
          <div className="invite-section-mpam">
            {/* Invitation Form */}
            <div className="invite-form-section">
              <h3>Send Agent Invitation</h3>
              <p className="invite-description">
                Invite experts to join your organization and help answer questions for this topic.
              </p>
              
              <form onSubmit={handleSendInvitation} className="invitation-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="invite-email">Email Address *</label>
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                      disabled={isSubmittingInvite}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="invite-name">Full Name *</label>
                    <input
                      id="invite-name"
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                      disabled={isSubmittingInvite}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="invite-role">Role</label>
                  <select
                    id="invite-role"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    disabled={isSubmittingInvite}
                  >
                    <option value="ROLE_USER">Expert Agent</option>
                    <option value="ROLE_ADMIN">Admin Agent</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="send-invite-button"
                  disabled={isSubmittingInvite || !inviteForm.email || !inviteForm.name}
                >
                  {isSubmittingInvite ? (
                    <>
                      <div className="button-spinner"></div>
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">📧</span>
                      Send Invitation
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Pending Invitations */}
            <div className="pending-invitations-section">
              <h3>Pending Invitations</h3>
              
              {isLoadingInvitations ? (
                <div className="loading-invitations">
                  <div className="loading-spinner-small"></div>
                  <span>Loading invitations...</span>
                </div>
              ) : pendingInvitations.length === 0 ? (
                <div className="empty-invitations">
                  <div className="empty-icon">📮</div>
                  <p>No pending invitations</p>
                  <span className="empty-description">Invitations you send will appear here</span>
                </div>
              ) : (
                <div className="invitations-list">
                  {pendingInvitations.map(invitation => (
                    <div key={invitation.tokenId} className="invitation-card">
                      <div className="invitation-info">
                        <div className="invitation-header">
                          <h4>{invitation.name}</h4>
                          <span className={`invitation-status ${invitation.isActivated ? 'activated' : 'pending'}`}>
                            {invitation.isActivated ? 'Activated' : 'Pending'}
                          </span>
                        </div>
                        <div className="invitation-details">
                          <span className="invitation-email">{invitation.email}</span>
                          <span className="invitation-role">{invitation.role === 'ROLE_ADMIN' ? 'Admin Agent' : 'Expert Agent'}</span>
                        </div>
                        <div className="invitation-timestamps">
                          <span className="sent-date">Sent: {formatDate(invitation.createdAt)}</span>
                          <span className="expires-date">Expires: {formatDate(invitation.expiresAt)}</span>
                        </div>
                      </div>
                      
                      {!invitation.isActivated && (
                        <div className="invitation-actions">
                          <button
                            className="resend-button"
                            onClick={() => handleResendInvitation(invitation.tokenId, invitation.email)}
                            disabled={invitationLoading[invitation.tokenId]}
                            title="Resend invitation email"
                          >
                            {invitationLoading[invitation.tokenId] ? (
                              <div className="button-spinner-small"></div>
                            ) : (
                              '🔄'
                            )}
                          </button>
                          
                          <button
                            className="cancel-button"
                            onClick={() => handleCancelInvitation(invitation.tokenId, invitation.email)}
                            disabled={invitationLoading[invitation.tokenId]}
                            title="Cancel invitation"
                          >
                            {invitationLoading[invitation.tokenId] ? (
                              <div className="button-spinner-small"></div>
                            ) : (
                              '🗑️'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer-mpam">
        <div className="footer-info">
          <span className="agents-summary">
            {activeAgentsCount} of {expertUsers.length} expert agents can answer questions for this topic
            {pendingInvitations.length > 0 && (
              <span className="pending-summary"> • {pendingInvitations.filter(inv => !inv.isActivated).length} pending invitation{pendingInvitations.filter(inv => !inv.isActivated).length !== 1 ? 's' : ''}</span>
            )}
          </span>
        </div>
        <button 
          onClick={async () => {
            console.log(`[MPAM ${projectId}] 🚨 Done button clicked!`, {
              timestamp: new Date().toISOString(),
              isUpdatingAny,
              hasOnAgentsUpdated: typeof onAgentsUpdated === 'function',
              hasOnClose: typeof onClose === 'function'
            });
            
            // Wait for any pending permission updates to complete
            if (isUpdatingAny) {
              console.log(`[MPAM ${projectId}] ⏳ Waiting for pending permission updates to complete...`, {
                isUpdatingAny,
                timestamp: new Date().toISOString()
              });
              // Wait for isUpdatingAny to become false
              while (isUpdatingAny) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              console.log(`[MPAM ${projectId}] ✅ All permission updates completed.`);
            } else {
              console.log(`[MPAM ${projectId}] ✅ No pending permission updates to wait for`);
            }
            
            // Trigger a final refresh to ensure parent has latest data
            if (onAgentsUpdated) {
              console.log(`[MPAM ${projectId}] 🔄 Triggering final refresh before closing...`);
              try {
                await onAgentsUpdated();
                console.log(`[MPAM ${projectId}] ✅ Final refresh completed successfully`);
              } catch (error) {
                console.error(`[MPAM ${projectId}] ❌ Error in final refresh:`, error);
              }
            } else {
              console.warn(`[MPAM ${projectId}] ⚠️ No onAgentsUpdated callback for final refresh`);
            }
            
            // Now close the modal
            console.log(`[MPAM ${projectId}] 🚪 Closing modal...`);
            if (onClose) {
              console.log(`[MPAM ${projectId}] 🎯 onClose callback exists, calling it`);
              onClose();
              console.log(`[MPAM ${projectId}] ✅ Modal close callback completed`);
            } else {
              console.warn(`[MPAM ${projectId}] ⚠️ No onClose callback provided`);
            }
          }} 
          className="done-button-mpam"
          disabled={isLoading || isUpdatingAny}
        >
          {isUpdatingAny ? 'Updating...' : 'Done'}
        </button>
      </div>
    </>
  );
};

export default ManageProjectAgentsModal; 