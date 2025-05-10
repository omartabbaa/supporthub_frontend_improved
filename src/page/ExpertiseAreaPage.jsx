// DepartmentProjectManagementPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './DepartmentProjectManagementPage.css'; // Reuse existing CSS
import { useUserContext } from '../context/LoginContext';
import ProjectModal from '../Components/ProjectModal';
import DepartmentProjectsGrid from '../Components/DepartmentProjectsGrid';
import { departments as departmentsApi, projects as projectsApi, setAuthToken } from '../services/ApiService';
import Tooltip from '../Components/Tooltip';
import SideNavbar from '../Components/SideNavbar';

const ExpertiseAreaPage = () => {
  const { role, token, stateBusinessId } = useUserContext();
  const { areaId } = useParams();
  const navigate = useNavigate();

  // We'll store just one department
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
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

  // Add the state for sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Add the toggle function
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    if (token) {
      setAuthToken(token); // Set auth token for future requests
    }
    fetchDepartment();
    fetchProjects();
    isBusinessOwnerFunction();
  }, [areaId, token]);

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

  // Modal functions - exactly the same as DepartmentProjectManagementPage
  const openAddProjectModal = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectImage('');
    setNewProjectAverageResponseTime('');
    setModalType('project');
    setModalVisible(true);
  };

  const openUpdateProjectModal = (projectId) => {
    console.log("Opening update modal for project ID:", projectId);
    
    // Find the project in our projects array
    const project = projects.find(p => parseInt(p.projectId) === parseInt(projectId));
    
    if (project) {
      console.log("Found project to update:", project);
      
      // Store the project ID directly from the found project object
      const projectIdToUpdate = project.projectId;
      console.log("Setting selectedProjectId to:", projectIdToUpdate);
      
      setSelectedProjectId(projectIdToUpdate);
      setNewProjectName(project.name || '');
      setNewProjectDescription(project.description || '');
      setNewProjectImage(project.imageUrl || project.image || '');
      setNewProjectAverageResponseTime(project.averageResponseTime || '');
      setModalType('updateProject');
      setModalVisible(true);
    } else {
      console.error("Project not found for ID:", projectId);
      setOperationError(`Could not find project with ID ${projectId}`);
    }
  };

  const addProject = async () => {
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
      
      console.log("Adding project with data:", newProject);
      
      await projectsApi.create(newProject);
      setModalVisible(false);
      setOperationSuccess('Project added successfully!');
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      setOperationError('Failed to add project. Please try again.');
    }
  };

  const updateProject = async () => {
    try {
      console.log("Starting update for project ID:", selectedProjectId);
      
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
      
      // Use the correct project ID from state
      const response = await projectsApi.update(selectedProjectId, updatedProject);
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
        await projectsApi.remove(projectId);
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
    <div className={`department-page-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <SideNavbar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
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
                role={role}
                isBusinessOwner={isBusinessOwner}
                onOpenUpdateProjectModal={openUpdateProjectModal}
                onDeleteProject={deleteProject}
                onOpenAddProjectModal={openAddProjectModal}
                businessName={businessName}
                singleDepartmentView={true} /* Flag to indicate we're showing just one department */
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
                onSubmit={() => addProject()}
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
                onSubmit={() => updateProject()}
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
      </main>
    </div>
  );
};

export default ExpertiseAreaPage;
