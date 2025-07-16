import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import './WidgetProcessSidebar.css';
import { departments as departmentsApi, users as usersApi, permissionWidgetConfigurationApi, projects as projectsApi, permissions as permissionsApi, setAuthToken } from '../services/ApiService';
import Tooltip from './Tooltip';
import DepartmentModal from './DepartmentModal';
import { useUserPermissions } from '../hooks/useUserPermissions';

const WidgetProcessSidebar = ({ isCollapsed, toggleSidebar, setActiveSidebarType, isSecondaryContent }) => {
  const { role, isLogin, stateBusinessId, token, userId, businessName } = useUserContext();
  const { maxDepartments } = useSubscriptionContext();
  const { hasProjectPermission } = useUserPermissions();
  const [expertiseAreas, setExpertiseAreas] = useState([]);
  const [isLoadingExpertise, setIsLoadingExpertise] = useState(false);
  const [errorExpertise, setErrorExpertise] = useState(null);
  const [userBusinessId, setUserBusinessId] = useState(null);
  const [hasWidgetAccess, setHasWidgetAccess] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const [modalVisible, setModalVisible] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [operationSuccess, setOperationSuccess] = useState(null);
  const [operationError, setOperationError] = useState(null);

  const [isUpdateModal, setIsUpdateModal] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);

  // For the new sidebar switcher system, we don't need internal collapse state
  // The sidebar is either shown or hidden entirely by the parent layout

  const [completedSteps, setCompletedSteps] = useState({});

  const departmentLimitNum = Number(maxDepartments);
  const atDepartmentLimit = !isNaN(departmentLimitNum) && departmentLimitNum > 0 && expertiseAreas.length >= departmentLimitNum;

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
      console.error('[WidgetProcessSidebar] Error checking widget access:', error);
      setHasWidgetAccess(false);
    } finally {
      setIsCheckingPermission(false);
    }
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
          console.error("Could not retrieve user's business ID for widget sidebar:", err);
        }
      } else {
        // Clear state when logged out
        setUserBusinessId(null);
        setExpertiseAreas([]);
        setAllProjects([]);
      }
    };
    getUserBusinessId();
    
    // Check widget access when component mounts
    checkWidgetAccess();
  }, [stateBusinessId, userId, token, role]);

  const getBusinessIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    if (window.location.pathname.includes('department-project-management')) {
      const index = pathSegments.findIndex(segment => segment === 'department-project-management');
      if (index >= 0 && index + 1 < pathSegments.length && /^\d+$/.test(pathSegments[index + 1])) {
        return pathSegments[index + 1];
      }
    }
    return null;
  };

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
      console.error("[WidgetProcessSidebar] Error fetching projects:", error);
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
      }));

      // Filter areas based on accessible projects (for non-admin users)
      if (role !== 'ROLE_ADMIN') {
        formattedAreas = formattedAreas.filter(area => hasAccessibleProjectsInArea(area.id));
      }

      setExpertiseAreas(formattedAreas);
    } catch (error) {
      console.error("Error fetching departments for widget sidebar:", error);
      if (error.response && error.response.status === 404) {
        setExpertiseAreas([]);
      } else {
        setErrorExpertise(error.response?.data?.message || "Failed to load expertise areas");
      }
    } finally {
      setIsLoadingExpertise(false);
    }
  };

  useEffect(() => {
    const businessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
    if (businessId) {
      fetchProjects().then(() => {
        fetchExpertiseAreas();
      });
    }
  }, [stateBusinessId, userBusinessId, location.pathname, operationSuccess, fetchProjects]);

  const openAddDepartmentModal = () => {
    setIsUpdateModal(false);
    setEditingDepartmentId(null);
    setDepartmentName('');
    setDepartmentDescription('');
    setOperationError(null);
    setOperationSuccess(null);
    setModalVisible(true);
  };

  const openUpdateDepartmentModal = (area) => {
    setIsUpdateModal(true);
    setEditingDepartmentId(area.id);
    setDepartmentName(area.name);
    setDepartmentDescription(area.description || '');
    setOperationError(null);
    setOperationSuccess(null);
    setModalVisible(true);
  };

  const addDepartment = async () => {
    const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
    if (!effectiveBusinessId) {
      setOperationError('Business ID is required.');
      return;
    }
    if (!departmentName.trim()) {
        setOperationError('Department name cannot be empty.');
        return;
    }
    try {
      const newDepartment = {
        departmentName: departmentName,
        description: departmentDescription,
        businessId: parseInt(effectiveBusinessId)
      };
      const response = await departmentsApi.create(newDepartment);
      setModalVisible(false);
      setDepartmentName('');
      setDepartmentDescription('');
      await fetchExpertiseAreas();
      setOperationSuccess('Expertise area added successfully!');
      setTimeout(() => setOperationSuccess(null), 3000);

      const newDeptId = response.data.departmentId || response.data.id;
      const currentBusinessNameForUrl = businessName || 'Business';
      navigate(`/department-project-management/${effectiveBusinessId}/${encodeURIComponent(currentBusinessNameForUrl)}/${newDeptId}`);
    } catch (error) {
      console.error('Error adding department:', error);
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
    if (!departmentName.trim()) {
      setOperationError("Expertise Area name cannot be empty.");
      return;
    }

    try {
      const updateData = {
        departmentName: departmentName,
        description: departmentDescription
      };
      
      await departmentsApi.update(editingDepartmentId, updateData);
      setOperationSuccess(`Expertise Area "${departmentName}" updated successfully!`);
      setModalVisible(false);
      await fetchExpertiseAreas();
    } catch (error) {
      console.error("Error updating department from widget sidebar:", error);
      setOperationError(error.response?.data?.message || error.message || "Failed to update expertise area.");
    }
  };

  const handleDeleteExpertiseArea = async (areaId, areaName) => {
    console.log(`WidgetProcessSidebar: Attempting to delete expertise area ID: ${areaId}, Name: ${areaName}`);
    if (!areaId) {
      console.error("WidgetProcessSidebar: Delete aborted. Area ID is undefined or null.");
      setOperationError("Cannot delete: Expertise Area ID is missing.");
      setTimeout(() => setOperationError(null), 7000);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the expertise area "${areaName}"? This action cannot be undone.`)) {
      console.log("WidgetProcessSidebar: Delete cancelled by user.");
      return;
    }

    setOperationError(null);
    setOperationSuccess(null);

    try {
      console.log(`WidgetProcessSidebar: Calling API to delete department ID: ${areaId}`);
      await departmentsApi.delete(areaId);
      console.log(`WidgetProcessSidebar: Successfully deleted department ID: ${areaId}`);
      setOperationSuccess(`Expertise Area "${areaName}" deleted successfully!`);
      
      await fetchExpertiseAreas();
      
      setTimeout(() => setOperationSuccess(null), 5000);
    } catch (error) {
      console.error(`WidgetProcessSidebar: Error deleting expertise area ID: ${areaId}:`, error.response || error.message);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete expertise area. It might have associated topics or other dependencies.";
      setOperationError(errorMessage);
      setTimeout(() => setOperationError(null), 7000);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isExpertiseAreaActive = (areaId) => location.pathname.includes(`/expertise-area/${areaId}`) || location.pathname.endsWith(`/${areaId}`);

  const markStepAsCompleted = (stepId) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
  };

  const getStepCompletionClass = (path) => {
    return completedSteps[path] ? 'step-completed' : '';
  };

  useEffect(() => {
    // Example: if you fetch completion status separately and merge
    // const fetchAndAugmentExpertiseAreas = async () => { ... };
    // fetchAndAugmentExpertiseAreas();
  }, [stateBusinessId, userBusinessId, token, completedSteps]);

  // Check if user has widget configuration access
  if (isCheckingPermission) {
    return (
      <nav className="widget-process-sidebar">
        <div className="widget-sidebar-header">
          <h2 className="widget-sidebar-title">Widget Configuration</h2>
        </div>
        <div className="widget-sidebar-content">
          <div className="widget-access-checking">
            <div className="loading-spinner"></div>
            <p>Checking widget access permissions...</p>
          </div>
        </div>
      </nav>
    );
  }

  if (!hasWidgetAccess) {
    return (
      <nav className="widget-process-sidebar">
        <div className="widget-sidebar-header">
          <h2 className="widget-sidebar-title">Widget Configuration</h2>
        </div>
        <div className="widget-sidebar-content">
          <div className="widget-access-denied">
            <div className="access-denied-icon">🔒</div>
            <h3>Access Denied</h3>
            <p>You don't have permission to manage widget configurations.</p>
            <p>Please contact your administrator to request access.</p>
            <div className="access-denied-actions">
              <button 
                onClick={() => setActiveSidebarType('userActions')}
                className="secondary-btn"
              >
                Go to Business Management
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="widget-process-sidebar">
        <div className="widget-sidebar-header">
          <h2 className="widget-sidebar-title">Widget Configuration</h2>
          <div className="widget-department-limit">
            Departments: {expertiseAreas.length} / {departmentLimitNum > 0 ? departmentLimitNum : 'Unlimited'}
          </div>
        </div>

        {operationSuccess && (
          <div className="widget-operation-success-message">
            <button className="widget-close-button" onClick={() => setOperationSuccess(null)}>×</button>
            {operationSuccess}
          </div>
        )}
        {operationError && (
          <div className="widget-operation-error-message">
            <button className="widget-close-button" onClick={() => setOperationError(null)}>×</button>
            {operationError}
          </div>
        )}

        <div className="widget-sidebar-section">
          <h3 className="widget-section-header">1. Data, expert agent Management</h3>
          {role === 'ROLE_ADMIN' && (
            <button onClick={openAddDepartmentModal} className="widget-action-button add-expertise-button" disabled={atDepartmentLimit}>
              <span className="widget-nav-icon">➕</span>
              <span className="widget-nav-text">Add Expertise Area</span>
            </button>
          )}
          {atDepartmentLimit && (
            <div className="widget-limit-warning">Department limit reached for your plan.</div>
          )}
          {isLoadingExpertise ? (
            <div className="widget-loading-container">
              <p className="widget-loading-text">Loading areas...</p>
              <div className="widget-loading-spinner"></div>
            </div>
          ) : errorExpertise ? (
            <p className="widget-error-text">{errorExpertise}</p>
          ) : expertiseAreas.length === 0 ? (
            <div className="widget-empty-expertise-container">
              <p className="widget-empty-text">No expertise areas found.</p>
              {role === 'ROLE_ADMIN' && (
                <button onClick={openAddDepartmentModal} className="widget-add-expertise-btn">
                  <span className="widget-nav-icon">+</span>
                  <span className="widget-nav-text">Add First Area</span>
                </button>
              )}
            </div>
          ) : (
            <ul className="widget-nav-list expertise-areas-list">
              {expertiseAreas.map((area, index) => (
                <li
                  key={area.id}
                  className={`${isExpertiseAreaActive(area.id) ? 'active' : ''} ${completedSteps[`expertise_area_${area.id}`] ? 'step-completed' : ''} expertise-area-item`}
                >
                  <Link to={`/expertise-area/${area.id}`} className="expertise-area-link">
                    <span className="step-indicator">{String.fromCharCode(97 + index)}.</span>
                    <span className="widget-nav-icon">📁</span>
                    <span className="widget-nav-text">{area.name}</span>
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
          )}
        </div>

        <div className="widget-sidebar-section">
          <h3 className="widget-section-header">2. Setup Steps</h3>
          <ul className="widget-nav-list">
            {isLogin && (
              <li className={`${isActive('/dashboard') ? 'active' : ''}`}>
                <Link to="/dashboard">
                  <span className="step-indicator">📊</span>
                  <span className="widget-nav-icon">🏠</span>
                  <span className="widget-nav-text">Dashboard</span>
                </Link>
              </li>
            )}
            {isLogin && (
              <li className={`${isActive('/ai-personalization') ? 'active' : ''} ${getStepCompletionClass('/ai-personalization')}`}>
                <Link to="/ai-personalization">
                  <span className="step-indicator">A.</span>
                  <span className="widget-nav-icon">🤖</span>
                  <span className="widget-nav-text">AI Personalization</span>
                </Link>
              </li>
            )}
            {isLogin && (
              <li className={`${isActive('/widget-customizer') ? 'active' : ''} ${getStepCompletionClass('/widget-customizer')}`}>
                <Link to="/widget-customizer">
                  <span className="step-indicator">B.</span>
                  <span className="widget-nav-icon">🎨</span>
                  <span className="widget-nav-text">Widget Designer</span>
                </Link>
              </li>
            )}
            {isLogin && (
              <li className={`${isActive('/widget-integration') ? 'active' : ''} ${getStepCompletionClass('/widget-integration')}`}>
                <Link to="/widget-integration">
                  <span className="step-indicator">C.</span>
                  <span className="widget-nav-icon">🔌</span>
                  <span className="widget-nav-text">Widget Integration</span>
                </Link>
              </li>
            )}
            {(role === 'ADMIN' || role === 'ROLE_ADMIN' || role === 'BUSINESS_OWNER' || role === 'ROLE_BUSINESS_OWNER') && (
              <li className={`${isActive('/api-key-manager') ? 'active' : ''} ${getStepCompletionClass('/api-key-manager')}`}>
                <Link to="/api-key-manager">
                  <span className="step-indicator">D.</span>
                  <span className="widget-nav-icon">🔑</span>
                  <span className="widget-nav-text">API Key Manager</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
        
        <div className="widget-sidebar-footer">
          <div className="widget-sidebar-navigation">
            <Link to="/" className="widget-home-link">
              <span className="widget-nav-icon">🏠</span>
              <span className="widget-nav-text">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {modalVisible && (
        <DepartmentModal
          onClose={() => setModalVisible(false)}
          onSubmit={isUpdateModal ? handleUpdateDepartment : addDepartment}
          departmentName={departmentName}
          setDepartmentName={setDepartmentName}
          departmentDescription={departmentDescription}
          setDepartmentDescription={setDepartmentDescription}
          isUpdate={isUpdateModal}
        />
      )}
    </>
  );
};

export default WidgetProcessSidebar;
