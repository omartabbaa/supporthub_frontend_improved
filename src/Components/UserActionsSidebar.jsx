import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import './UserActionsSidebar.css';
import { departments as departmentsApi, users as usersApi, projects as projectsApi, permissions as permissionsApi, setAuthToken } from '../services/ApiService';
import DepartmentModal from './DepartmentModal';
import Tooltip from './Tooltip';
import { useUserPermissions } from '../hooks/useUserPermissions';

const UserActionsSidebar = ({ isCollapsed, toggleSidebar, setActiveSidebarType, isSecondaryContent }) => {
  const { role, isLogin, stateBusinessId, token, userId, businessName } = useUserContext();
  const { maxDepartments } = useSubscriptionContext();
  const { hasProjectPermission } = useUserPermissions();
  const location = useLocation();
  const navigate = useNavigate();

  // For the new sidebar switcher system, we don't need internal collapse state
  // The sidebar is either shown or hidden entirely by the parent layout

  // --- State for Expertise Areas ---
  const [expertiseAreas, setExpertiseAreas] = useState([]);
  const [isLoadingExpertise, setIsLoadingExpertise] = useState(false);
  const [errorExpertise, setErrorExpertise] = useState(null);
  const [userBusinessId, setUserBusinessId] = useState(null);
  
  // --- State for Projects (needed for permission checking) ---
  const [allProjects, setAllProjects] = useState([]);

  // --- State for Department Modal ---
  const [modalVisible, setModalVisible] = useState(false);
  const [departmentNameInput, setDepartmentNameInput] = useState('');
  const [departmentDescriptionInput, setDepartmentDescriptionInput] = useState('');
  const [operationSuccess, setOperationSuccess] = useState(null);
  const [operationError, setOperationError] = useState(null);

  const [isUpdateModal, setIsUpdateModal] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);

  const isActive = (path) => location.pathname.startsWith(path);
  const isExpertiseAreaActive = (areaId) => {
    return location.pathname.includes(`/expertise-area/${areaId}`) || location.pathname.endsWith(`/${areaId}`);
  };

  // --- Business ID and Expertise Area Fetching Logic ---
  const getBusinessIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    if (window.location.pathname.includes('department-project-management')) {
      const index = pathSegments.findIndex(segment => segment === 'department-project-management');
      if (index >= 0 && index + 1 < pathSegments.length && /^\d+$/.test(pathSegments[index + 1])) {
        return pathSegments[index + 1];
      }
    }
    const businessMatch = location.pathname.match(/\/business\/(\d+)/);
    if (businessMatch) return businessMatch[1];
    return null;
  };

  useEffect(() => {
    const getUserBusinessId = async () => {
      if (stateBusinessId) {
        setUserBusinessId(stateBusinessId);
        return;
      }
      if (userId && token) {
        try {
          const response = await usersApi.getById(userId);
          if (response.data && response.data.businessId) {
            setUserBusinessId(response.data.businessId);
          }
        } catch (err) {
          console.error("UserActionsSidebar: Could not retrieve user's business ID:", err);
        }
      }
    };
    if (isLogin) {
        getUserBusinessId();
    }
  }, [stateBusinessId, userId, token, isLogin]);

  const fetchProjects = useCallback(async () => {
    const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
    if (!effectiveBusinessId || !token) {
      setAllProjects([]);
      return;
    }

    try {
      setAuthToken(token);
      const response = await projectsApi.getByBusinessId(effectiveBusinessId);
      setAllProjects(response.data || []);
    } catch (error) {
      console.error("UserActionsSidebar: Error fetching projects:", error);
      setAllProjects([]);
    }
  }, [stateBusinessId, userBusinessId, token]);

  const hasAccessibleProjectsInArea = (areaId) => {
    if (role === 'ROLE_ADMIN') {
      // Admins can see all areas regardless of project permissions
      return true;
    }

    // Check if the area has any projects that the user has permission to access
    const areaProjects = allProjects.filter(project => 
      String(project.departmentId) === String(areaId) || String(project.department_id) === String(areaId)
    );
    
    if (areaProjects.length === 0) {
      // No projects in this area, don't show it
      return false;
    }

    // Check if user has permission for at least one project
    return areaProjects.some(project => hasProjectPermission(project.projectId));
  };

  const fetchExpertiseAreas = async () => {
    setIsLoadingExpertise(true);
    setErrorExpertise(null);
    const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();

    if (!effectiveBusinessId) {
      setExpertiseAreas([]);
      setIsLoadingExpertise(false);
      return;
    }

    try {
      const response = await departmentsApi.getByBusinessId(effectiveBusinessId);
      let formattedAreas = response.data.map(dept => ({
        id: dept.departmentId || dept.id,
        name: dept.departmentName || dept.name || 'Unnamed Area',
        description: dept.description || ""
      })).sort((a, b) => a.name.localeCompare(b.name));

      // Filter areas based on accessible projects (for non-admin users)
      if (role !== 'ROLE_ADMIN') {
        formattedAreas = formattedAreas.filter(area => hasAccessibleProjectsInArea(area.id));
      }

      setExpertiseAreas(formattedAreas);
    } catch (error) {
      console.error("UserActionsSidebar: Error fetching expertise areas:", error);
      if (error.response && error.response.status === 404) {
        setExpertiseAreas([]);
      } else {
        setErrorExpertise(error.response?.data?.message || "Failed to load expertise areas.");
      }
    } finally {
      setIsLoadingExpertise(false);
    }
  };

  useEffect(() => {
    if (isLogin) {
      const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
      if (effectiveBusinessId) {
        fetchProjects().then(() => {
          fetchExpertiseAreas();
        });
      }
    } else {
      setExpertiseAreas([]);
      setAllProjects([]);
    }
  }, [isLogin, stateBusinessId, userBusinessId, location.pathname, fetchProjects]);

  useEffect(() => {
    if (isLogin) {
      const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
      if (effectiveBusinessId) {
        fetchProjects().then(() => {
          fetchExpertiseAreas();
        });
      }
    }
  }, [isLogin, stateBusinessId, userBusinessId, location.pathname, operationSuccess, fetchProjects]);

  // --- Modal and Department Operations ---
  const openAddDepartmentModal = () => {
    setIsUpdateModal(false);
    setEditingDepartmentId(null);
    setDepartmentNameInput('');
    setDepartmentDescriptionInput('');
    setOperationError(null);
    setOperationSuccess(null);
    setModalVisible(true);
  };

  const openUpdateDepartmentModal = (area) => {
    setIsUpdateModal(true);
    setEditingDepartmentId(area.id);
    setDepartmentNameInput(area.name);
    setDepartmentDescriptionInput(area.description || '');
    setOperationError(null);
    setOperationSuccess(null);
    setModalVisible(true);
  };

  const addDepartment = async (e) => {
    e.preventDefault();
    setOperationSuccess(null);
    setOperationError(null);
    const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();

    if (!effectiveBusinessId) {
      setOperationError('Business ID is required to add an expertise area.');
      return;
    }
    if (!departmentNameInput.trim()) {
      setOperationError("Expertise area name cannot be empty.");
      return;
    }

    try {
      const newDepartment = {
        departmentName: departmentNameInput,
        description: departmentDescriptionInput,
        businessId: parseInt(effectiveBusinessId)
      };
      const response = await departmentsApi.create(newDepartment);
      setModalVisible(false);
      setDepartmentNameInput('');
      setDepartmentDescriptionInput('');
      await fetchExpertiseAreas();
      setOperationSuccess('Expertise area added successfully!');
      setTimeout(() => setOperationSuccess(null), 3000);
    } catch (error) {
      console.error('UserActionsSidebar: Error adding department:', error);
      setOperationError(error.response?.data?.message || 'Failed to add expertise area.');
      setTimeout(() => setOperationError(null), 3000);
    }
  };

  const handleUpdateDepartment = async () => {
    setOperationError(null);
    setOperationSuccess(null);
    if (!editingDepartmentId) {
      setOperationError("Cannot update: Department ID is missing.");
      return;
    }
    if (!departmentNameInput.trim()) {
      setOperationError("Expertise Area name cannot be empty.");
      return;
    }

    try {
      await departmentsApi.update(editingDepartmentId, {
        departmentName: departmentNameInput,
        description: departmentDescriptionInput,
      });
      setOperationSuccess(`Expertise Area "${departmentNameInput}" updated successfully!`);
      setModalVisible(false);
      fetchExpertiseAreas();
    } catch (error) {
      console.error("UserActionsSidebar: Error updating department:", error);
      setOperationError(error.response?.data?.message || error.message || "Failed to update expertise area.");
    }
  };

  const handleDeleteExpertiseArea = async (areaId, areaName) => {
    console.log(`UserActionsSidebar: Attempting to delete expertise area ID: ${areaId}, Name: ${areaName}`);
    if (!areaId) {
      console.error("UserActionsSidebar: Delete aborted. Area ID is undefined or null.");
      setOperationError("Cannot delete: Expertise Area ID is missing.");
      setTimeout(() => setOperationError(null), 7000);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the expertise area "${areaName}"? This action cannot be undone.`)) {
      console.log("UserActionsSidebar: Delete cancelled by user.");
      return;
    }
    
    setOperationError(null);
    setOperationSuccess(null);

    try {
      console.log(`UserActionsSidebar: Calling API to delete department ID: ${areaId}`);
      await departmentsApi.delete(areaId);
      console.log(`UserActionsSidebar: Successfully deleted department ID: ${areaId}`);
      setOperationSuccess(`Expertise Area "${areaName}" deleted successfully!`);
      
      await fetchExpertiseAreas();

      setTimeout(() => setOperationSuccess(null), 5000);
    } catch (error) {
      console.error(`UserActionsSidebar: Error deleting expertise area ID: ${areaId}:`, error.response || error.message);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete expertise area. It might have associated topics or other dependencies.";
      setOperationError(errorMessage);
      setTimeout(() => setOperationError(null), 7000);
    }
  };

  const departmentLimitNum = Number(maxDepartments);
  const atDepartmentLimit = !isNaN(departmentLimitNum) && departmentLimitNum > 0 && expertiseAreas.length >= departmentLimitNum;

  if (!isLogin) {
    return null;
  }

  return (
    <>
    
      <nav className="user-actions-sidebar">
        
        <div className="user-actions-sidebar-header">
          <h2 className="user-actions-sidebar-title">Business Management</h2>
          <div className="user-actions-department-limit">
            Departments: {expertiseAreas.length} / {departmentLimitNum > 0 ? departmentLimitNum : 'Unlimited'}
          </div>
        </div>

        {operationSuccess && (
          <div className="user-actions-operation-success-message">
            <button className="user-actions-close-button" onClick={() => setOperationSuccess(null)}>×</button>
            {operationSuccess}
          </div>
        )}
        {operationError && (
          <div className="user-actions-operation-error-message">
            <button className="user-actions-close-button" onClick={() => setOperationError(null)}>×</button>
            {operationError}
          </div>
        )}

        {/* Section 1: Widget Creation Process (Expertise Areas) */}
        {isLogin && (
          <div className="user-actions-sidebar-section">
            <h3 className="user-actions-section-header">1. Data, expert agent Management</h3>
           
            {role === 'ROLE_ADMIN' && (
              <button onClick={openAddDepartmentModal} className="user-actions-action-button add-expertise-button" disabled={atDepartmentLimit}>
                <span className="user-actions-nav-icon">➕</span>
                <span className="user-actions-nav-text">Add Expertise Area</span>
              </button>
            )}
            {atDepartmentLimit && (
              <div className="user-actions-limit-warning">Department limit reached for your plan.</div>
            )}
            {isLoadingExpertise ? (
              <div className="user-actions-loading-container">
                <p className="user-actions-loading-text">Loading areas...</p>
                <div className="user-actions-loading-spinner"></div>
              </div>
            ) : errorExpertise ? (
              <p className="user-actions-error-text">{errorExpertise}</p>
            ) : expertiseAreas.length === 0 && (stateBusinessId || userBusinessId || getBusinessIdFromUrl()) ? (
              <div className="user-actions-empty-expertise-container">
                <p className="user-actions-empty-text">No expertise areas defined.</p>
              </div>
            ) : expertiseAreas.length > 0 ? (
              <ul className="user-actions-nav-list user-actions-expertise-list">
                {expertiseAreas.map((area, index) => (
                  <li
                    key={area.id}
                    className={`${isExpertiseAreaActive(area.id) ? 'active' : ''} expertise-area-item`}
                  >
                    <Link to={`/expertise-area/${area.id}`} className="expertise-area-link">
                      <span className="user-actions-step-indicator">{String.fromCharCode(97 + index)}.</span>
                      <span className="user-actions-nav-icon">📁</span>
                      <span className="user-actions-nav-text">{area.name}</span>
                    </Link>
                    {role === 'ROLE_ADMIN' && (
                      <div className="expertise-actions">
                        <Tooltip text={`Edit ${area.name}`}>
                          <button
                            onClick={() => openUpdateDepartmentModal(area)}
                            className="edit-expertise-button"
                            aria-label={`Edit ${area.name}`}
                          >
                            ✏️
                          </button>
                        </Tooltip>
                        <Tooltip text={`Delete ${area.name}`}>
                          <button
                            onClick={() => handleDeleteExpertiseArea(area.id, area.name)}
                            className="delete-expertise-button"
                            aria-label={`Delete ${area.name}`}
                          >
                            🗑️
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : null }
          </div>
        )}

        {/* Section 2: Navigation */}
        <div className="user-actions-sidebar-section">
          <h3 className="user-actions-section-header">Navigation</h3>
          <ul className="user-actions-nav-list">
            <li className={isActive('/dashboard') ? 'active' : ''}>
              <Link to="/dashboard">
                <span className="user-actions-nav-icon">📊</span>
                <span className="user-actions-nav-text">Dashboard</span>
              </Link>
            </li>
            <li className={isActive('/agent-questions') ? 'active' : ''}>
              <Link to="/agent-questions">
                <span className="user-actions-nav-icon">❓</span>
                <span className="user-actions-nav-text">My Questions</span>
              </Link>
            </li>
            <li className={isActive('/agent-analytics') ? 'active' : ''}>
              <Link to="/agent-analytics">
                <span className="user-actions-nav-icon">📊</span>
                <span className="user-actions-nav-text">My Analytics</span>
              </Link>
            </li>
            <li className={isActive('/documentation') ? 'active' : ''}>
              <Link to="/documentation">
                <span className="user-actions-nav-icon">📚</span>
                <span className="user-actions-nav-text">Documentation</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Section 3: Admin Tools */}
        {(role === 'ADMIN' || role === 'ROLE_ADMIN' || role === 'BUSINESS_OWNER' || role === 'ROLE_BUSINESS_OWNER') && (
          <div className="user-actions-sidebar-section">
            <h3 className="user-actions-section-header">Admin Tools</h3>
            <ul className="user-actions-nav-list">
              {(role === 'ADMIN' || role === 'ROLE_ADMIN') && (
                <>
                  <li className={isActive('/admin-analytics') ? 'active' : ''}>
                    <Link to="/admin-analytics">
                      <span className="user-actions-nav-icon">📈</span>
                      <span className="user-actions-nav-text">Team Analytics</span>
                    </Link>
                  </li>
                  <li className={isActive('/manage-widget-agents') ? 'active' : ''}>
                    <Link to="/manage-widget-agents">
                      <span className="user-actions-nav-icon">⚙️</span>
                      <span className="user-actions-nav-text">Widget Permissions</span>
                    </Link>
                  </li>
                  <li className={isActive('/manage-user-details') ? 'active' : ''}>
                    <Link to="/manage-user-details">
                      <span className="user-actions-nav-icon">👤</span>
                      <span className="user-actions-nav-text">User Profile Requirements</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
        
        <div className="user-actions-sidebar-footer">
          <div className="user-sidebar-navigation">
            <Link to="/" className="user-home-link">
              <span className="user-actions-nav-icon">🏠</span>
              <span className="user-actions-nav-text">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {modalVisible && (
        <DepartmentModal
          onClose={() => setModalVisible(false)}
          onSubmit={isUpdateModal ? handleUpdateDepartment : addDepartment}
          departmentName={departmentNameInput}
          setDepartmentName={setDepartmentNameInput}
          departmentDescription={departmentDescriptionInput}
          setDepartmentDescription={setDepartmentDescriptionInput}
          isUpdate={isUpdateModal}
          operationSuccess={operationSuccess}
          operationError={operationError}
        />
      )}
    </>
  );
};

export default UserActionsSidebar; 