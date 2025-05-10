import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import './SideNavbar.css';
import { departments as departmentsApi, users as usersApi } from '../services/ApiService';
import Tooltip from './Tooltip';
import DepartmentModal from './DepartmentModal';

const SideNavbar = ({ isCollapsed, toggleSidebar }) => {
  const { role, isLogin, stateBusinessId, token, userId, businessName } = useUserContext();
  const [expertiseAreas, setExpertiseAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userBusinessId, setUserBusinessId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // For the department modal
  const [modalVisible, setModalVisible] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [operationSuccess, setOperationSuccess] = useState(null);
  const [operationError, setOperationError] = useState(null);

  // Allow external control of collapsed state if provided
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  // Use external or internal collapsed state based on what's provided
  const isExpanded = isCollapsed !== undefined ? !isCollapsed : !internalCollapsed;
  
  // Use external or internal toggle function
  const handleToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Get user's business ID if it's not in context
  useEffect(() => {
    const getUserBusinessId = async () => {
      if (stateBusinessId) {
        setUserBusinessId(stateBusinessId);
        return;
      }
      
      if (userId && token) {
        try {
          // Try to get user details which might include business ID
          const response = await usersApi.getById(userId);
          if (response.data && response.data.businessId) {
            console.log("Found user's business ID from profile:", response.data.businessId);
            setUserBusinessId(response.data.businessId);
          }
        } catch (err) {
          console.error("Could not retrieve user's business ID:", err);
        }
      }
    };
    
    getUserBusinessId();
  }, [stateBusinessId, userId, token]);

  // Add a ref to track if the component is mounted
  const isMounted = React.useRef(true);

  // Setup and cleanup for the isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Replace the fetch function to use the correct API endpoint
  const fetchExpertiseAreas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get business ID from available sources
      const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
      
      if (!effectiveBusinessId) {
        console.log("No business ID available");
        setExpertiseAreas([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching departments for business ID: ${effectiveBusinessId}`);
      
      // Use the business-specific endpoint that exists in your backend
      // Instead of fetching all departments and filtering
      const response = await departmentsApi.getByBusinessId(effectiveBusinessId);
      
      console.log(`Found ${response.data.length} departments for business ID ${effectiveBusinessId}`);
      
      // Format departments for the UI
      const formattedAreas = response.data.map(dept => ({
        id: dept.departmentId || dept.id,
        name: dept.departmentName || dept.name || 'Unnamed Area',
        description: dept.description || ""
      }));
      
      setExpertiseAreas(formattedAreas);
    } catch (error) {
      console.error("Error fetching departments:", error);
      // More specific error handling
      if (error.response && error.response.status === 404) {
        // This business may not have any departments yet
        setExpertiseAreas([]);
      } else {
        setError("Failed to load departments");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure useEffect runs when needed
  useEffect(() => {
    // Only fetch when we have a business ID
    const businessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
    
    if (businessId) {
      console.log(`Business ID available: ${businessId}, fetching departments`);
      fetchExpertiseAreas();
    }
  }, [stateBusinessId, userBusinessId, location.pathname]); // Include location.pathname to refresh on route changes

  // Simplified business ID extraction
  const getBusinessIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    
    if (window.location.pathname.includes('department-project-management')) {
      // In the URL pattern /department-project-management/:businessId/:businessName/...
      // The business ID should be right after "department-project-management"
      const index = pathSegments.findIndex(segment => segment === 'department-project-management');
      if (index >= 0 && index + 1 < pathSegments.length && /^\d+$/.test(pathSegments[index + 1])) {
        return pathSegments[index + 1];
      }
    }
    
    return null;
  };

  // Function to open the add department modal
  const openAddDepartmentModal = () => {
    setDepartmentName('');
    setDepartmentDescription('');
    setOperationError(null); // Clear any previous errors
    setModalVisible(true);
  };

  // Add department with proper refresh
  const addDepartment = async () => {
    try {
      // Get business ID
      const effectiveBusinessId = stateBusinessId || userBusinessId || getBusinessIdFromUrl();
      
      if (!effectiveBusinessId) {
        setOperationError('Business ID is required to add a department');
        return;
      }
      
      // Create department with correct business ID
      const newDepartment = {
        departmentName: departmentName,
        description: departmentDescription,
        businessId: parseInt(effectiveBusinessId)
      };
      
      const response = await departmentsApi.create(newDepartment);
      console.log("Department created:", response.data);
      
      // Close modal and clear form
      setModalVisible(false);
      setDepartmentName('');
      setDepartmentDescription('');
      
      // Important: Refresh departments to get the new one
      await fetchExpertiseAreas();
      
      // Navigate to new department
      const newDeptId = response.data.departmentId || response.data.id;
      navigate(`/department-project-management/${effectiveBusinessId}/${encodeURIComponent(businessName || 'Business')}/${newDeptId}`);
    } catch (error) {
      console.error('Error adding department:', error);
      setOperationError('Failed to add department');
    }
  };

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  const isExpertiseAreaActive = (areaId) => {
    // Just check if the URL ends with the areaId
    return location.pathname.endsWith(`/${areaId}`);
  };

  return (
    <>
      <nav className={`side-navbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="navbar-toggle" onClick={handleToggle}>
          {isExpanded ? '◀' : '▶'}
        </div>
        
        <div className="navbar-header">
          {businessName && (
            <h2 className="organization-name">{businessName}</h2>
          )}
        </div>
        
        {/* Success message */}
        {operationSuccess && (
          <div className="operation-success-message">
            <button className="close-button" onClick={() => setOperationSuccess(null)}>×</button>
            {operationSuccess}
          </div>
        )}
        
        {/* Error message */}
        {operationError && (
          <div className="operation-error-message">
            <button className="close-button" onClick={() => setOperationError(null)}>×</button>
            {operationError}
          </div>
        )}
        
        <div className="navbar-section expertise-section">
          <div className="section-header">
            <h3>Expertise Areas</h3>
            {/* Add button in section header for better visibility */}
            {(role?.toUpperCase().includes('ADMIN') || 
              role?.toUpperCase().includes('BUSINESS_OWNER') || 
              stateBusinessId || userBusinessId) && (
              <Tooltip text="Add a new expertise area">
                <button 
                  onClick={openAddDepartmentModal} 
                  className="add-header-button"
                  aria-label="Add expertise area"
                >
                  <span>+</span>
                </button>
              </Tooltip>
            )}
          </div>
          
          {isLoading ? (
            <div className="loading-container">
              <p className="loading-text">Loading expertise areas...</p>
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : expertiseAreas.length === 0 ? (
            <div className="empty-expertise-container">
              <p className="empty-text">No expertise areas found</p>
              
              {/* Enhanced add button when no areas exist */}
              {(role?.toUpperCase().includes('ADMIN') || 
                role?.toUpperCase().includes('BUSINESS_OWNER') || 
                stateBusinessId || userBusinessId) && (
                <button 
                  onClick={openAddDepartmentModal} 
                  className="add-expertise-standalone-btn"
                >
                  <span className="nav-icon">+</span>
                  <span className="nav-text">Add Your First Expertise Area</span>
                </button>
              )}
            </div>
          ) : (
            <ul className="nav-list expertise-areas-list">
              {console.log("Rendering expertise areas:", expertiseAreas)}
              {expertiseAreas.map(area => (
                <li key={area.id} className={isExpertiseAreaActive(area.id) ? 'active' : ''}>
                  <Tooltip text={area.description || area.name}>
                    <Link 
                      to={`/department-project-management/${stateBusinessId || userBusinessId}/${encodeURIComponent(businessName || 'Business')}/${area.id}`} 
                      className="expertise-area-link"
                      onClick={() => console.log(`Clicked expertise area: ${area.name} (ID: ${area.id})`)}
                    >
                      <span className="nav-icon">🔍</span>
                      <span className="nav-text">{area.name}</span>
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="navbar-section">
          <h3>Navigation</h3>
          <ul className="nav-list">
            <li className={isActive('/my-questions') ? 'active' : ''}>
              <Link to="/my-questions">
                <span className="nav-icon">❓</span>
                <span className="nav-text">My Questions</span>
              </Link>
            </li>
            <li className={isActive('/my-analytics') ? 'active' : ''}>
              <Link to="/my-analytics">
                <span className="nav-icon">📊</span>
                <span className="nav-text">My Analytics</span>
              </Link>
            </li>
            <li className={isActive('/documentation') ? 'active' : ''}>
              <Link to="/documentation">
                <span className="nav-icon">📚</span>
                <span className="nav-text">Documentation</span>
              </Link>
            </li>
            {(role === 'ADMIN' || role === 'ROLE_ADMIN') && (
              <>
                <li className={isActive('/admin-dashboard') ? 'active' : ''}>
                  <Link to="/admin-dashboard">
                    <span className="nav-icon">⚙️</span>
                    <span className="nav-text">Manage Agent Permissions</span>
                  </Link>
                </li>
                <li className={isActive('/admin-analytics') ? 'active' : ''}>
                  <Link to="/admin-analytics">
                    <span className="nav-icon">📈</span>
                    <span className="nav-text">Team Analytics</span>
                  </Link>
                </li>
                <li className={isActive('/agent-management') ? 'active' : ''}>
                  <Link to="/agent-management">
                    <span className="nav-icon">👥</span>
                    <span className="nav-text">Agent Management</span>
                  </Link>
                </li>
                <li className={isActive('/api-key-manager') ? 'active' : ''}>
                  <Link to="/api-key-manager">
                    <span className="nav-icon">🔑</span>
                    <span className="nav-text">API Key Manager</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        
        <div className="navbar-footer">
          <Link to="/" className="home-link">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </Link>
        </div>
      </nav>
      
      {/* Add the department modal */}
      {modalVisible && (
        <DepartmentModal
          onClose={() => setModalVisible(false)}
          onSubmit={addDepartment}
          departmentName={departmentName}
          setDepartmentName={setDepartmentName}
          departmentDescription={departmentDescription}
          setDepartmentDescription={setDepartmentDescription}
          isUpdate={false}
        />
      )}

    </>
  );
};

export default SideNavbar; 