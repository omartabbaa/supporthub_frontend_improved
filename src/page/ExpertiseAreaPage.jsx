// DepartmentProjectManagementPage.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './DepartmentProjectManagementPage.css'; // Reuse existing CSS
import { useUserContext } from '../context/LoginContext';
import ProjectModal from '../Components/ProjectModal';
import DepartmentProjectsGrid from '../Components/DepartmentProjectsGrid';
import { departments as departmentsApi, projects as projectsApi, permissions as permissionsApi, users as usersApi, setAuthToken } from '../services/ApiService';
import Tooltip from '../Components/Tooltip';
import { useSidebarContext } from '../context/SidebarContext.jsx';
import UploadYourOwnData from './UploadYourOwnData';
import QuestionOverviewPage from './QuestionOverviewPage';
import ManageProjectAgentsModal from '../Components/ManageProjectAgentsModal';

const ExpertiseAreaPage = () => {
  const { role, token, stateBusinessId } = useUserContext();
  const { setActiveSidebarType } = useSidebarContext();
  const { areaId } = useParams();
  const navigate = useNavigate();

  // We'll store just one department
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectPermissions, setProjectPermissions] = useState([]); // Add permissions state for agent counts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [error, setError] = useState(null);

  // Modal-related state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Inputs for Project Modal
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectImage, setNewProjectImage] = useState('');
  const [newProjectAverageResponseTime, setNewProjectAverageResponseTime] = useState('');

  const [isBusinessOwner, setIsBusinessOwner] = useState('');

  // Add a new state for operation-specific errors
  const [operationError, setOperationError] = useState(null);
  const [operationSuccess, setOperationSuccess] = useState(null);

  // Add a new state for help mode
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  
  // Add state for loading
  const [isLoading, setIsLoading] = useState(true);

  // Modal state management
  const [activeModalInfo, setActiveModalInfo] = useState(null);

  // Permission management state (minimal addition)
  const [permissionRefreshTrigger, setPermissionRefreshTrigger] = useState(0);

  // Modal handler function
  const openModalHandler = useCallback((modalType, projectDetails) => {
    console.log(`[ExpertiseAreaPage] openModalHandler called. Type: ${modalType}, ProjectDetails:`, projectDetails);
    
    // Validate required data
    if (!projectDetails || !projectDetails.projectId) {
      console.error("[ExpertiseAreaPage] Missing project details or projectId:", projectDetails);
      setOperationError("Cannot open modal: Missing project information.");
      return;
    }

    // Validate department ID for manage agents modal
    if (modalType === 'manageAgents' && !projectDetails.departmentId) {
      console.error("[ExpertiseAreaPage] Missing departmentId for manageAgents modal:", projectDetails);
      setOperationError("Cannot manage agents: Missing department information.");
      return;
    }

    // Clear any existing errors
    setOperationError(null);
    
    const modalData = {
      projectId: projectDetails.projectId,
      projectName: projectDetails.name || projectDetails.projectName,
      departmentName: projectDetails.departmentName,
      departmentId: projectDetails.departmentId,
    };

    console.log(`[ExpertiseAreaPage] Setting activeModalInfo:`, { type: modalType, data: modalData });
    setActiveModalInfo({ type: modalType, data: modalData });
  }, [setOperationError]);

  // Close modal handler
  const closeActiveModal = useCallback(() => {
    console.log('[ExpertiseAreaPage] Closing active modal');
    setActiveModalInfo(null);
  }, []);

  // Upload success handler
  const handleUploadSuccess = useCallback(() => {
    console.log('[ExpertiseAreaPage] Upload successful');
    // You can add any additional logic here if needed
    // The modal will remain open, but you could close it if desired:
    // closeActiveModal();
  }, []);

  // Handle agents updated - minimal implementation
  const handleAgentsUpdated = useCallback(async () => {
    console.log('[ExpertiseAreaPage] 🚨 Agent permissions updated, refreshing...');
    
    try {
      // Refresh the data
      await fetchDepartment();
      await fetchProjects();
      await fetchAllProjectPermissions(); // Also refresh permissions for agent counts
      
      // Trigger permission refresh in grid
      setPermissionRefreshTrigger(prev => prev + 1);
      
      // Show success message
      setOperationSuccess('Agent permissions updated successfully!');
      
    } catch (error) {
      console.error('[ExpertiseAreaPage] Error refreshing after agent update:', error);
      setOperationError('Failed to refresh after permission update. Please refresh the page.');
    }
  }, []); // Empty dependencies for now, will be called directly

  useEffect(() => {
    setActiveSidebarType('widget');
    if (token) {
      setAuthToken(token); // Set auth token for future requests
    }
    if (areaId && stateBusinessId && token) {
      fetchDepartment();
      fetchProjects();
      fetchAllProjectPermissions(); // Also fetch permissions for agent counts
    }
    isBusinessOwnerFunction();
  }, [areaId, token, setActiveSidebarType]);

  useEffect(() => {
    isBusinessOwnerFunction();
  }, [stateBusinessId, departments]);

  useEffect(() => {
    // Log when projects change
    console.log("Current projects in ExpertiseAreaPage:", projects);
  }, [projects]);

  useEffect(() => {
    console.log("Current role:", role);
    console.log("Current isBusinessOwner status:", isBusinessOwner);
  }, [role, isBusinessOwner]);

  const isBusinessOwnerFunction = () => {
    try {
      if (departments.length > 0 && departments[0].businessId == stateBusinessId) {
        setIsBusinessOwner("yes");
      } else {
        setIsBusinessOwner("no");
      }
    } catch (error) {
      console.error('Error checking business owner status:', error);
      setIsBusinessOwner("no");
    }
  };

  const fetchDepartment = async () => {
    try {
      setIsLoading(true);
      const response = await departmentsApi.getAll();
      
      // Find the specific department/expertise area by ID
      const departmentData = response.data.find(
        dept => (dept.departmentId === parseInt(areaId) || dept.id === parseInt(areaId))
      );
      
      if (departmentData) {
        const formattedDepartment = {
          id: departmentData.departmentId || departmentData.id,
          departmentName: departmentData.departmentName || departmentData.name || "Unnamed Department",
          description: departmentData.description || "",
          businessId: departmentData.businessId
        };
        
        // Set as an array with one item to maintain compatibility with DepartmentProjectsGrid
        setDepartments([formattedDepartment]);
      } else {
        setError("Expertise area not found");
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      setError('Failed to fetch expertise area. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      
      // Filter projects by department ID
      const filteredProjects = response.data.filter(
        project => project.departmentId === parseInt(areaId)
      ).map(project => ({
        projectId: project.projectId,
        departmentId: project.departmentId,
        name: project.name,
        description: project.description || "",
        imageUrl: project.imageUrl || project.image || "",
        averageResponseTime: project.averageResponseTime || ""
      }));
      
      console.log("Filtered projects:", filteredProjects); // Debugging
      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Add function to fetch project permissions for agent counts (active and non-active SUPPORT_AGENT roles)
  const fetchAllProjectPermissions = async () => {
    try {
      console.log('[ExpertiseAreaPage] Fetching project permissions for agent counts');
      if (!stateBusinessId || !token || !areaId) {
        console.log('[ExpertiseAreaPage] Missing stateBusinessId, token, or areaId for permissions');
        setProjectPermissions([]);
        return;
      }
      
      setAuthToken(token);
      
      // Get all projects and filter by current department ID
      const projectsResponse = await projectsApi.getAll();
      const departmentProjects = projectsResponse.data.filter(
        project => project.departmentId === parseInt(areaId)
      );
      
      if (departmentProjects.length === 0) {
        console.log('[ExpertiseAreaPage] No projects found for current department');
        setProjectPermissions([]);
        return;
      }

      // Get all business users to filter by role
      let expertAgents = [];
      try {
        const usersResponse = await usersApi.getByBusinessId ? 
          await usersApi.getByBusinessId(stateBusinessId) : 
          await usersApi.getAll();
        const businessUsers = usersResponse.data || [];
        
        // Filter to only expert agents from this business
        expertAgents = businessUsers.filter(user => 
          (user.role === 'SUPPORT_AGENT' || user.role === 'ROLE_SUPPORT_AGENT') &&
          (user.businessId === parseInt(stateBusinessId) || user.businessId === stateBusinessId)
        );
        
        console.log(`[ExpertiseAreaPage] Found ${expertAgents.length} expert agents in business`);
      } catch (error) {
        console.error('[ExpertiseAreaPage] Error fetching business users:', error);
        expertAgents = [];
      }
      
      // Fetch permissions for each project in this department
      const permissionsPromises = departmentProjects.map(async (project) => {
        try {
          const permissionsResponse = await permissionsApi.getByProjectId(project.projectId);
          const allPermissions = permissionsResponse.data || [];
          
          // Filter permissions to only include expert agents and separate active/inactive
          const expertPermissions = allPermissions.filter(permission => 
            expertAgents.some(user => user.userId === permission.userId)
          );
          
          // Count active agents (those with canAnswer: true)
          const activeAgents = expertPermissions.filter(permission => permission.canAnswer);
          
          // Count non-active agents (expert agents without permissions or with canAnswer: false)
          const agentsWithPermissions = expertPermissions.map(p => p.userId);
          const inactiveAgentsWithoutPermissions = expertAgents.filter(agent => 
            !agentsWithPermissions.includes(agent.userId)
          );
          const inactiveAgentsWithPermissions = expertPermissions.filter(permission => !permission.canAnswer);
          
          const totalInactiveCount = inactiveAgentsWithoutPermissions.length + inactiveAgentsWithPermissions.length;
          
          console.log(`[ExpertiseAreaPage] Project ${project.projectId} (${project.name}):`, {
            totalExperts: expertAgents.length,
            activeAgents: activeAgents.length,
            inactiveAgents: totalInactiveCount,
            totalPermissions: allPermissions.length,
            expertPermissions: expertPermissions.length
          });
          
          return {
            projectId: project.projectId,
            projectName: project.name,
            permissions: expertPermissions, // Keep original permissions for compatibility
            agentCounts: {
              total: expertAgents.length,
              active: activeAgents.length,
              inactive: totalInactiveCount,
              activePermissions: activeAgents,
              inactiveWithoutPermissions: inactiveAgentsWithoutPermissions,
              inactiveWithPermissions: inactiveAgentsWithPermissions
            }
          };
        } catch (error) {
          console.error(`[ExpertiseAreaPage] Error fetching permissions for project ${project.projectId}:`, error);
          return {
            projectId: project.projectId,
            projectName: project.name,
            permissions: [],
            agentCounts: {
              total: expertAgents.length,
              active: 0,
              inactive: expertAgents.length,
              activePermissions: [],
              inactiveWithoutPermissions: expertAgents,
              inactiveWithPermissions: []
            }
          };
        }
      });
      
      const allPermissions = await Promise.all(permissionsPromises);
      console.log('[ExpertiseAreaPage] All expert permissions with counts fetched for current department:', allPermissions);
      setProjectPermissions(allPermissions);
      
    } catch (error) {
      console.error('[ExpertiseAreaPage] Error fetching project permissions:', error);
      setProjectPermissions([]);
    }
  };

  // Add this function after the other functions
  const checkAndCreateDefaultDepartment = useCallback(async () => {
    try {
      console.log("[ExpertiseAreaPage] Checking for default department in business");
      
      // Get the business ID from current department
      const businessId = departments[0]?.businessId;
      if (!businessId) {
        console.log("[ExpertiseAreaPage] No business ID found, skipping default department creation");
        return;
      }
      
      // Fetch all departments for this business to check for default
      const response = await departmentsApi.getByBusinessId(businessId);
      const allDepartments = response.data || [];
      
      // Check if a default department already exists - EXACT match only
      const hasDefaultDepartment = allDepartments.some(dept => 
        dept.departmentName?.toLowerCase().trim() === "default"
      );
      
      if (hasDefaultDepartment) {
        console.log("[ExpertiseAreaPage] Default department already exists");
        return;
      }
      
      // Only try to create default department if user is business owner AND admin
      if (role !== "ROLE_ADMIN" || isBusinessOwner !== "yes") {
        console.log("[ExpertiseAreaPage] User doesn't have sufficient permissions for default department creation");
        return;
      }
      
      console.log("[ExpertiseAreaPage] No default department found, creating one...");
      
      // Create default department only - project will be created by DepartmentProjectManagementPage
      const defaultDepartmentData = {
        departmentName: "default",
        description: "Default expertise area for general inquiries and topics",
        businessId: businessId
      };
      
      const createResponse = await departmentsApi.create(defaultDepartmentData);
      console.log("[ExpertiseAreaPage] Default department created successfully:", createResponse.data);
      
      setOperationSuccess("Default expertise area created successfully!");
      
    } catch (error) {
      console.error('[ExpertiseAreaPage] Error checking/creating default department:', error);
      
      // Handle specific error cases silently
      if (error.response?.status === 409) {
        console.log("[ExpertiseAreaPage] Default department already exists (409 conflict)");
      } else if (error.response?.status === 403) {
        console.log("[ExpertiseAreaPage] User doesn't have permission to create default department");
      } else {
        console.log("[ExpertiseAreaPage] Failed to create default department:", error.message);
      }
    }
  }, [departments, role, isBusinessOwner, setOperationSuccess]);

  // Modal functions - exactly the same as DepartmentProjectManagementPage
  const openAddProjectModal = (departmentId) => {
    // Check if this is the default department - EXACT match
    const department = departments.find(d => d.id === departmentId);
    if (department && department.departmentName?.toLowerCase().trim() === "default") {
      setOperationError("Cannot add projects to the default department. The default department can only contain the default project.");
      return;
    }
    
    setSelectedDepartmentId(departmentId);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectImage('');
    setNewProjectAverageResponseTime('');
    setModalType('project');
    setModalVisible(true);
  };

  const openUpdateModal = useCallback((departmentId, projectId) => {
    console.log("[ExpertiseAreaPage] Opening update modal for project ID:", projectId, "department ID:", departmentId);
    
    // Find the project to check if it's the default one
    const project = projects.find(p => p.projectId === projectId);
    if (project && project.name?.toLowerCase().trim() === "default topic") {
      setOperationError("Cannot update the default project. This project is system-managed.");
      return;
    }
    
    if (project) {
      console.log("[ExpertiseAreaPage] Found project to update:", project);
      
      setSelectedProjectId(projectId);
      setNewProjectName(project.name || '');
      setNewProjectDescription(project.description || '');
      setNewProjectImage(project.imageUrl || project.image || '');
      setNewProjectAverageResponseTime(project.averageResponseTime || '');
      setModalType('updateProject');
      setModalVisible(true);
      setOperationError(null);
    } else {
      console.error("[ExpertiseAreaPage] Project not found for ID:", projectId);
      setOperationError("Project not found. Please try again.");
    }
  }, [projects, setOperationError]);

  const addProject = async (imageFile = null) => {
    try {
      if (!departments.length > 0) {
        setOperationError('Cannot add project: Department not found.');
        return;
      }
      
      const newProject = {
        name: newProjectName,
        description: newProjectDescription,
        imageUrl: newProjectImage,
        image: newProjectImage,
        averageResponseTime: newProjectAverageResponseTime,
        departmentId: departments[0].id
      };
      
      console.log("Adding project with data:", newProject, "hasImageFile:", !!imageFile);
      
      // Use the new API method that handles both file upload and regular creation
      await projectsApi.create(newProject, imageFile);
      setModalVisible(false);
      setOperationSuccess('Project added successfully!');
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      setOperationError('Failed to add project. Please try again.');
    }
  };

  const updateProject = async (imageFile = null) => {
    try {
      console.log("Starting update for project ID:", selectedProjectId, "hasImageFile:", !!imageFile);
      
      if (!selectedProjectId) {
        console.error("No selectedProjectId found");
        setOperationError("Cannot update project: No project selected");
        return;
      }
      
      // Find the department ID
      const departmentId = departments[0].id;
      console.log("Department ID for update:", departmentId);
      
      // Get the current project from the projects array to debug image field names
      const currentProject = projects.find(p => p.projectId == selectedProjectId);
      console.log("Current project before update:", currentProject);
      
      // Create the update object with both image and imageUrl fields to be safe
      const updatedProject = {
        projectId: selectedProjectId,
        name: newProjectName,
        description: newProjectDescription,
        imageUrl: newProjectImage,
        image: newProjectImage,
        averageResponseTime: newProjectAverageResponseTime,
        departmentId: departmentId
      };
      
      console.log("Updating project with data:", updatedProject);
      
      // Use the new API method that handles both file upload and regular update
      const response = await projectsApi.update(selectedProjectId, updatedProject, imageFile);
      console.log("Update response:", response);
      
      setModalVisible(false);
      setOperationSuccess('Project updated successfully!');
      
      // Refresh projects list immediately and then again after a delay
      fetchProjects();
      
      // Get a fresh copy after a delay to ensure backend has updated
      setTimeout(() => {
        fetchProjects();
      }, 500);
    } catch (error) {
      console.error('Error updating project:', error);
      setOperationError(`Failed to update project: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectsApi.delete(projectId);
        setOperationSuccess('Project deleted successfully!');
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        setOperationError('Failed to delete project. Please try again.');
      }
    }
  };

  const businessName = departments.length > 0 ? 
    (departments[0].businessName || "Business") : "Business";

  return (
    <div className={`department-page-container`}>
      <main className={`department-project-management-page ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
        <Helmet>
          <title>
            {departments.length > 0 
              ? `${departments[0].departmentName} - Expertise Area` 
              : 'Expertise Area'} | SupportHub
          </title>
          <meta name="description" content="Manage projects within this expertise area." />
        </Helmet>

        <header className="page-header">
          <nav aria-label="Breadcrumb" className="breadcrumb-nav">
            <ol className="breadcrumb">
              <li><a href="/business-overview">Business Overview</a></li>
              <li aria-current="page">
                {departments.length > 0 ? departments[0].departmentName : 'Expertise Area'}
              </li>
            </ol>
          </nav>
        </header>

        <div className="help-mode-toggle-container">
          <span className="help-mode-label">Help Mode</span>
          <button 
            className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
            onClick={() => setHelpModeEnabled(!helpModeEnabled)}
            data-tooltip="Toggle help tooltips on/off"
            data-tooltip-position="left"
          >
            <div className="help-mode-toggle-circle"></div>
            <span className="sr-only">Toggle help mode</span>
          </button>
        </div>

        {/* Error messages section */}
        {error && <div className="error-message" role="alert">{error}</div>}
        {operationError && (
          <div className="operation-error-message" role="alert">
            <button className="close-button" onClick={() => setOperationError(null)} aria-label="Close error message">×</button>
            {operationError}
          </div>
        )}
        {operationSuccess && (
          <div className="operation-success-message" role="status">
            <button className="close-button" onClick={() => setOperationSuccess(null)} aria-label="Close success message">×</button>
            {operationSuccess}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="loading-state">
            <p>Loading expertise area information...</p>
          </div>
        ) : (
          <>
            {/* Empty state */}
            {Array.isArray(departments) && departments.length === 0 ? (
              <section className="empty-state">
                <h2>Expertise area not found</h2>
                <Link to="/business-overview" className="button">
                  Back to Business Overview
                </Link>
              </section>
            ) : (
              /* Main content - using the same DepartmentProjectsGrid component */
              <DepartmentProjectsGrid
                departments={departments}
                projects={projects}
                projectPermissions={projectPermissions}
                role={role}
                isBusinessOwner={isBusinessOwner}
                onOpenModal={openModalHandler}
                businessName={businessName}
                singleDepartmentView={true} /* Flag to indicate we're showing just one department */
                helpModeEnabled={helpModeEnabled}
                currentDepartmentId={areaId}
                onOpenUpdateDepartmentModal={() => {}}
                onDeleteDepartment={() => {}}
                onOpenUpdateProjectModal={openUpdateModal}
                onDeleteProject={deleteProject}
                onOpenAddProjectModal={openAddProjectModal}
                onOpenAddDepartmentModal={() => {}}
                permissionRefreshTrigger={permissionRefreshTrigger}
              >
                {department => (
                  <Tooltip text={`Manage projects in the ${department.departmentName} department`}>
                    <div className="department-card">
                      {/* Department content handled by DepartmentProjectsGrid */}
                    </div>
                  </Tooltip>
                )}
              </DepartmentProjectsGrid>
            )}
          </>
        )}

        {modalVisible && (
          <>
            {modalType === 'project' && (
              <ProjectModal
                onClose={() => setModalVisible(false)}
                onSubmit={addProject}
                projectName={newProjectName}
                setProjectName={setNewProjectName}
                projectDescription={newProjectDescription}
                setProjectDescription={setNewProjectDescription}
                projectImage={newProjectImage}
                setProjectImage={setNewProjectImage}
                averageResponseTime={newProjectAverageResponseTime}
                setAverageResponseTime={setNewProjectAverageResponseTime}
                isUpdate={false}
                role={role}
                isBusinessOwner={isBusinessOwner}
              />
            )}
            {modalType === 'updateProject' && (
              <ProjectModal
                onClose={() => setModalVisible(false)}
                onSubmit={updateProject}
                projectName={newProjectName}
                setProjectName={setNewProjectName}
                projectDescription={newProjectDescription}
                setProjectDescription={setNewProjectDescription}
                projectImage={newProjectImage}
                setProjectImage={setNewProjectImage}
                averageResponseTime={newProjectAverageResponseTime}
                setAverageResponseTime={setNewProjectAverageResponseTime}
                isUpdate={true}
                role={role}
                isBusinessOwner={isBusinessOwner}
              />
            )}
          </>
        )}

        {/* Upload Data Modal */}
        {activeModalInfo?.type === 'uploadData' && activeModalInfo?.data?.projectId && (
          <div className="modal-overlay">
            <div className="modal-container upload-data-modal-container">
              <UploadYourOwnData
                isModalMode={true}
                initialProjectId={activeModalInfo.data.projectId}
                initialProjectName={activeModalInfo.data.projectName}
                initialDepartmentName={activeModalInfo.data.departmentName}
                initialBusinessName={businessName}
                onCloseModal={closeActiveModal}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </div>
        )}

        {/* Question Overview Modal */}
        {activeModalInfo?.type === 'questionOverview' && activeModalInfo?.data?.projectId && (
          <div className="modal-overlay">
            <div className="modal-container question-overview-modal-container">
              <QuestionOverviewPage
                isModalMode={true}
                modalProjectId={activeModalInfo.data.projectId}
                modalProjectName={activeModalInfo.data.projectName}
                modalDepartmentName={activeModalInfo.data.departmentName}
                modalBusinessName={businessName}
                onCloseModal={closeActiveModal}
              />
            </div>
          </div>
        )}

        {/* Manage Project Agents Modal - Admin only */}
        {activeModalInfo?.type === 'manageAgents' && 
         activeModalInfo?.data?.projectId && 
         activeModalInfo?.data?.departmentId && 
         role === 'ROLE_ADMIN' && (
          <div className="modal-overlay">
            <div className="modal-container manage-agents-modal-container">
              <ManageProjectAgentsModal
                projectId={activeModalInfo.data.projectId}
                projectName={activeModalInfo.data.projectName}
                departmentId={activeModalInfo.data.departmentId}
                businessId={stateBusinessId}
                onClose={closeActiveModal}
                onAgentsUpdated={handleAgentsUpdated}
                helpModeEnabled={helpModeEnabled}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExpertiseAreaPage;
