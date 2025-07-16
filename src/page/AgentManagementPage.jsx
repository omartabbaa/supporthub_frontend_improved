import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { agentInvitations as agentInvitationsApi, departments as departmentsApi } from '../services/ApiService';
import './AgentManagementPage.css';
import Tooltip from '../Components/Tooltip';
import { useSidebarContext } from '../context/SidebarContext.jsx';

const AgentManagementPage = () => {
  const { userId, role, stateBusinessId } = useUserContext();
  const navigate = useNavigate();
  const { setActiveSidebarType } = useSidebarContext();
  
  // State for invitation form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('ROLE_USER');
  
  // State for invitation list
  const [invitations, setInvitations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'hidden'

  useEffect(() => {
    setActiveSidebarType('userActions');
  }, [setActiveSidebarType]);

  useEffect(() => {
    if (!userId || role !== 'ROLE_ADMIN') {
      navigate('/login');
      return;
    }
    
    fetchInvitations();
    fetchDepartments();
  }, [userId, stateBusinessId]);

  const fetchInvitations = async () => {
    if (!stateBusinessId) return;
    
    try {
      setIsLoading(true);
      const response = await agentInvitationsApi.getByBusiness(stateBusinessId);
      setInvitations(response.data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!stateBusinessId) return;
    
    try {
      const response = await departmentsApi.getAll();
      const filteredDepartments = response.data.filter(
        dept => dept.businessId === stateBusinessId
      );
      setDepartments(filteredDepartments);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !name) {
      setError('Please fill out all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const invitationData = {
        email,
        name,
        role: selectedRole,
        businessId: stateBusinessId,
      };
      
      await agentInvitationsApi.create(invitationData);
      
      // Reset form
      setEmail('');
      setName('');
      setSelectedRole('ROLE_USER');
      
      // Show success message and refresh invitations
      setSuccessMessage('Invitation sent successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      fetchInvitations();
      setFormMode('hidden');
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (tokenId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      await agentInvitationsApi.cancel(tokenId);
      setSuccessMessage('Invitation cancelled successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchInvitations();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (tokenId) => {
    try {
      await agentInvitationsApi.resend(tokenId);
      setSuccessMessage('Invitation resent successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError('Failed to resend invitation');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <main className={`agent-management-content ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
        <div className="page-header">
          <h1>Agent Management</h1>
          
          <div className="help-mode-container">
            <span className="help-mode-label">Help Mode</span>
            <button 
              className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
              onClick={() => setHelpModeEnabled(!helpModeEnabled)}
            >
              <span className="help-mode-toggle-circle"></span>
            </button>
          </div>
        </div>
        
        {error && <div key="error" className="error-message">{error}</div>}
        {successMessage && <div key="success" className="success-message">{successMessage}</div>}
        
        <div className="actions-container">
          {formMode === 'hidden' ? (
            <button 
              className="invite-button"
              onClick={() => setFormMode('create')}
            >
              Invite New Agent
            </button>
          ) : (
            <button 
              className="cancel-form-button"
              onClick={() => setFormMode('hidden')}
            >
              Cancel
            </button>
          )}
        </div>
        
        <section className="content-section">
          {formMode === 'create' && (
            <form onSubmit={handleSubmit} className="invite-form">
              <h2>Invite New Agent</h2>
              
              <div className="form-group">
                <label htmlFor="name">Agent Name</label>
                <Tooltip text={helpModeEnabled ? "Full name of the agent" : ""}>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter agent's full name"
                    required
                  />
                </Tooltip>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <Tooltip text={helpModeEnabled ? "Email where the invitation will be sent" : ""}>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </Tooltip>
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <Tooltip text={helpModeEnabled ? "Select the role for this agent" : ""}>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="ROLE_USER">Agent</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </Tooltip>
              </div>
              
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}
          
          {isLoading && formMode !== 'create' ? (
            <div className="loading-message">Loading invitations...</div>
          ) : (
            <div className="invitations-list">
              {invitations.length === 0 ? (
                <p className="no-invitations">No pending invitations</p>
              ) : (
                invitations.map(invitation => (
                  <div 
                    key={invitation.tokenId || `invitation-${Math.random()}`} 
                    className={`invitation-card ${invitation.isActivated ? 'activated' : ''}`}
                  >
                    <div className="invitation-status">
                      {invitation.isActivated ? (
                        <span className="status-badge activated">Activated</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </div>
                    
                    <div className="invitation-title">
                      <h3>{invitation.name}</h3>
                    </div>
                    
                    <div className="invitation-details">
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{invitation.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Role:</span>
                        <span className="detail-value">{invitation.role.replace('ROLE_', '')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Sent:</span>
                        <span className="detail-value">{formatDate(invitation.createdAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Expires:</span>
                        <span className="detail-value">{formatDate(invitation.expiresAt)}</span>
                      </div>
                    </div>
                    
                    {!invitation.isActivated && (
                      <div className="invitation-actions">
                        <button 
                          className="resend-button"
                          onClick={() => handleResendInvitation(invitation.tokenId)}
                          data-tooltip="Resend the invitation email"
                        >
                          Resend
                        </button>
                        <button 
                          className="cancel-invitation-button"
                          onClick={() => handleCancelInvitation(invitation.tokenId)}
                          data-tooltip="Cancel this invitation"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default AgentManagementPage; 