// DepartmentProjectManagementPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./DepartmentProjectManagementPage.css";
import { useUserContext } from "../context/LoginContext";
import ProjectModal from '../Components/ProjectModal';
import DepartmentModal from '../Components/DepartmentModal';
import DepartmentProjectsGrid from '../Components/DepartmentProjectsGrid';
import { departments as departmentsApi, projects as projectsApi, setAuthToken } from '../services/ApiService';

const DepartmentProjectManagementPage = () => {
  const { role, token, stateBusinessId } = useUserContext();
  const { businessId, businessName } = useParams(); 

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

  // Inputs for Department Modal
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('');

  const [isBusinessOwner, setIsBusinessOwner] = useState('');

  // Add a new state for operation-specific errors
  const [operationError, setOperationError] = useState(null);
  const [operationSuccess, setOperationSuccess] = useState(null);

  useEffect(() => {
    if (token) {
      setAuthToken(token); // Set auth token for future requests
    }
    fetchDepartments();
    fetchProjects();
    isBusinessOwnerFunction();
  }, [businessId, token]);

  useEffect(() => {
    isBusinessOwnerFunction();
  }, [stateBusinessId, businessId]);

  useEffect(() => {
    console.log("DepartmentProjectManagementPage - Current state:");
    console.log("token:", token);
    console.log("stateBusinessId:", stateBusinessId);
    console.log("businessId from params:", businessId);
    console.log("isBusinessOwner:", isBusinessOwner);
  }, [token, stateBusinessId, businessId, isBusinessOwner]);

  const isBusinessOwnerFunction = () => {
    try {
      if (businessId == stateBusinessId) {
        setIsBusinessOwner("yes");
      } else {
        setIsBusinessOwner("no");
      }
    } catch (error) {
      console.error('Error checking business owner status:', error);
      setIsBusinessOwner("no");
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log("Fetching departments with business ID:", businessId);
      const response = await departmentsApi.getAll();
      console.log("All departments:", response.data);
      
      // Log first department to inspect the exact structure
      if (response.data && response.data.length > 0) {
        console.log("First department structure:", JSON.stringify(response.data[0]));
      }
      
      const departmentsData = response.data.map(department => {
        // Inspect each department during mapping
        console.log("Processing department:", department);
        
        // Check for the correct field name - handle both possible field names
        const name = department.departmentName || department.name || "Unnamed Department";
        
        return {
          id: department.departmentId || department.id,
          departmentName: name,  // Use the detected name
          description: department.description || "",
          businessId: department.businessId
        };
      });

      const businessIdNumber = Number(businessId);
      if (isNaN(businessIdNumber)) {
        setError('Invalid business ID provided.');
        return;
      }

      // Log all businessIds to help debug
      const uniqueBusinessIds = [...new Set(departmentsData.map(dept => dept.businessId))];
      console.log("Unique business IDs in departments:", uniqueBusinessIds);
      
      const filteredDepartments = departmentsData.filter(department => department.businessId === businessIdNumber);
      console.log("Filtered departments for businessId", businessIdNumber, ":", filteredDepartments);
      
      if (filteredDepartments.length === 0) {
        console.log("No departments found for business ID:", businessIdNumber);
        console.log("This could be because:");
        console.log("1. No departments exist for this business");
        console.log("2. Departments exist but have a different businessId");
        console.log("3. The businessId in the URL doesn't match your actual business ID");
      }
      
      setDepartments(filteredDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments. Please try again later.');
    }
  };

  const fetchProjects = async () => {
    try {
      console.log("Fetching all projects...");
      const response = await projectsApi.getAll();
      console.log("All projects:", response.data);
      
      // Log first project to inspect the exact structure
      if (response.data && response.data.length > 0) {
        console.log("First project structure:", JSON.stringify(response.data[0]));
      }
      
      const projectsData = response.data.map(project => {
        // Log each project during mapping
        console.log("Processing project:", project);
        
        return {
          projectId: project.projectId,
          departmentId: project.departmentId,
          name: project.name,
          description: project.description || "",
          image: project.image || 'https://via.placeholder.com/150',
          averageResponseTime: project.averageResponseTime || '24h',
        };
      });
      
      // Log unique department IDs in projects
      const uniqueDepartmentIds = [...new Set(projectsData.map(proj => proj.departmentId))];
      console.log("Unique department IDs in projects:", uniqueDepartmentIds);
      
      // Log projects for each department
      departments.forEach(dept => {
        const deptProjects = projectsData.filter(proj => proj.departmentId === dept.id);
        console.log(`Projects for department ${dept.id} (${dept.departmentName}):`, deptProjects);
      });
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects. Please try again later.');
    }
  };

  const addProject = async (departmentId) => {
    // Reset error and success messages
    setError(null);
    setOperationError(null);
    setOperationSuccess(null);
    
    // Validate inputs
    if (!newProjectName.trim()) {
      setOperationError('Project name cannot be empty');
      return;
    }
    
    try {
      // Log the department ID we're trying to add the project to
      console.log("Creating project for department ID:", departmentId);
      
      // Create project data object for better logging
      const projectData = {
        name: newProjectName,
        description: newProjectDescription || "No description provided",
        image: newProjectImage || 'https://via.placeholder.com/150', // Default image if none provided
        averageResponseTime: newProjectAverageResponseTime || '24h', // Default response time if none provided
        departmentId: departmentId
      };
      
      // Log the exact data being sent
      console.log("Sending project data:", JSON.stringify(projectData));
      
      // Make the API call
      const response = await projectsApi.create(projectData);
      
      // Log the response
      console.log("Project creation response:", response);
      console.log("Project created successfully:", response.data);
      
      // Refresh projects list
      await fetchProjects();
      
      // Double-check if the new project appears in the unfiltered list
      const allProjects = await projectsApi.getAll();
      console.log("All projects after creation:", allProjects.data);
      
      // Check if our new project exists in the response
      const newProject = allProjects.data.find(
        proj => proj.name === newProjectName && proj.departmentId === departmentId
      );
      
      if (newProject) {
        console.log("New project found in response:", newProject);
      } else {
        console.warn("New project not found in response. It may have been created with different data or failed silently.");
      }
      
      setModalVisible(false);
      setOperationSuccess('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      
      // Log the full error object
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorMessage = 'Failed to create project. Please try again.';
      
      if (error.response) {
        // Log detailed response information
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
        
        // Handle specific error status codes
        switch (error.response.status) {
          case 400:
            errorMessage = `Invalid project data: ${error.response.data.message || error.response.data.error || 'Please check your inputs'}`;
            break;
          case 401:
            errorMessage = 'You must be logged in to create projects';
            break;
          case 403:
            errorMessage = 'You do not have permission to create projects';
            break;
          case 404:
            errorMessage = 'Department not found. Please refresh the page.';
            break;
          case 409:
            errorMessage = 'A project with this name already exists in this department';
            break;
          case 500:
            errorMessage = `Server error: ${error.response.data.message || error.response.data.error || 'Please try again later'}`;
            break;
          default:
            errorMessage = `Error (${error.response.status}): ${error.response.data.message || error.response.data.error || 'Unknown error'}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        errorMessage = `Error: ${error.message}`;
      }
      
      // Set a visible error message for the user
      setOperationError(errorMessage);
      
      // Also show an alert to make sure the error is noticed
      alert(`Error creating project: ${errorMessage}`);
    }
  };

  const addDepartment = async () => {
    // Reset error and success messages
    setError(null);
    setOperationError(null);
    setOperationSuccess(null);
    
    // Validate inputs
    if (!newDepartmentName.trim()) {
      setOperationError('Department name cannot be empty');
      return;
    }
    
    // Convert businessId to a number to ensure proper comparison
    const businessIdNumber = Number(businessId);
    if (isNaN(businessIdNumber)) {
      setOperationError('Invalid business ID. Please refresh the page.');
      return;
    }
    
    try {
      console.log("Creating department with business ID:", businessIdNumber);
      
      const departmentData = {
        departmentName: newDepartmentName,
        description: newDepartmentDescription || "No description provided",
        businessId: businessIdNumber
      };
      
      console.log("Sending department data:", departmentData);
      
      const response = await departmentsApi.create(departmentData);
      
      console.log("Department created successfully:", response.data);
      
      // Refresh departments list
      await fetchDepartments();
      
      // Double-check if the new department appears in the unfiltered list
      const allDepartments = await departmentsApi.getAll();
      console.log("All departments after creation:", allDepartments.data);
      
      // Check if our new department exists in the response
      const newDepartment = allDepartments.data.find(
        dept => dept.departmentName === newDepartmentName && dept.businessId === businessIdNumber
      );
      
      if (newDepartment) {
        console.log("New department found in response:", newDepartment);
      } else {
        console.warn("New department not found in response. It may have been created with a different businessId.");
      }
      
      setModalVisible(false);
      setOperationSuccess('Department created successfully!');
    } catch (error) {
      console.error('Error creating department:', error);
      
      let errorMessage = 'Failed to create department. Please try again.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle specific error status codes
        switch (error.response.status) {
          case 400:
            errorMessage = `Invalid department data: ${error.response.data.message || 'Please check your inputs'}`;
            break;
          case 401:
            errorMessage = 'You must be logged in to create departments';
            break;
          case 403:
            errorMessage = 'You do not have permission to create departments';
            break;
          case 409:
            errorMessage = 'A department with this name already exists';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setOperationError(errorMessage);
    }
  };

  const updateProject = async (projectId) => {
    // Reset error and success messages
    setError(null);
    setOperationError(null);
    setOperationSuccess(null);
    
    // Validate inputs
    if (!newProjectName.trim()) {
      setOperationError('Project name cannot be empty');
      return;
    }
    
    try {
      const response = await projectsApi.update(projectId, {
        name: newProjectName,
        description: newProjectDescription,
        image: newProjectImage,
        averageResponseTime: newProjectAverageResponseTime,
        departmentId: selectedDepartmentId 
      });
      
      console.log("Project updated successfully:", response.data);
      await fetchProjects();
      setModalVisible(false);
      setOperationSuccess('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      
      let errorMessage = 'Failed to update project. Please try again.';
      
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 400:
            errorMessage = `Invalid project data: ${error.response.data.message || 'Please check your inputs'}`;
            break;
          case 401:
            errorMessage = 'You must be logged in to update projects';
            break;
          case 403:
            errorMessage = 'You do not have permission to update this project';
            break;
          case 404:
            errorMessage = 'Project not found. It may have been deleted.';
            break;
          case 409:
            errorMessage = 'A project with this name already exists in this department';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`;
        }
        
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setOperationError(errorMessage);
    }
  };

  const updateDepartment = async (departmentId) => {
    // Reset error and success messages
    setError(null);
    setOperationError(null);
    setOperationSuccess(null);
    
    // Validate inputs
    if (!newDepartmentName.trim()) {
      setOperationError('Department name cannot be empty');
      return;
    }
    
    try {
      const response = await departmentsApi.update(departmentId, {
        departmentName: newDepartmentName,
        description: newDepartmentDescription,
        businessId: businessId
      });
      
      console.log("Department updated successfully:", response.data);
      await fetchDepartments();
      setModalVisible(false);
      setOperationSuccess('Department updated successfully!');
    } catch (error) {
      console.error('Error updating department:', error);
      
      let errorMessage = 'Failed to update department. Please try again.';
      
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 400:
            errorMessage = `Invalid department data: ${error.response.data.message || 'Please check your inputs'}`;
            break;
          case 401:
            errorMessage = 'You must be logged in to update departments';
            break;
          case 403:
            errorMessage = 'You do not have permission to update this department';
            break;
          case 404:
            errorMessage = 'Department not found. It may have been deleted.';
            break;
          case 409:
            errorMessage = 'A department with this name already exists';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`;
        }
        
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setOperationError(errorMessage);
    }
  };

  const deleteProject = async (projectId) => {
    // Reset error and success messages
    setError(null);
    setOperationError(null);
    setOperationSuccess(null);
    
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all questions and answers in this project.')) {
      return;
    }
    
    try {
      await projectsApi.delete(projectId);
      await fetchProjects();
      setOperationSuccess('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      
      let errorMessage = 'Failed to delete project. Please try again.';
      
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 401:
            errorMessage = 'You must be logged in to delete projects';
            break;
          case 403:
            errorMessage = 'You do not have permission to delete this project';
            break;
          case 404:
            errorMessage = 'Project not found. It may have already been deleted.';
            break;
          case 409:
            errorMessage = 'Cannot delete project with active questions';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`;
        }
        
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setOperationError(errorMessage);
    }
  };

  const deleteDepartment = async (departmentId) => {
    // Reset error and success messages
    setError(null);
    setOperationError(null);
    setOperationSuccess(null);
    
    if (!window.confirm('Are you sure you want to delete this department? This will also delete all projects in this department.')) {
      return;
    }
    
    try {
      await departmentsApi.delete(departmentId);
      await fetchDepartments();
      await fetchProjects();
      setOperationSuccess('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      
      let errorMessage = 'Failed to delete department. Please try again.';
      
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 401:
            errorMessage = 'You must be logged in to delete departments';
            break;
          case 403:
            errorMessage = 'You do not have permission to delete this department';
            break;
          case 404:
            errorMessage = 'Department not found. It may have already been deleted.';
            break;
          case 409:
            errorMessage = 'Cannot delete department with active projects';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`;
        }
        
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setOperationError(errorMessage);
    }
  };

  // Handlers for opening modals
  const openUpdateProjectModal = (departmentId, projectId) => {
    const project = projects.find(p => p.projectId === projectId);
    if (project) {
      setSelectedDepartmentId(departmentId);
      setSelectedProjectId(projectId);
      setNewProjectName(project.name);
      setNewProjectDescription(project.description);
      setNewProjectImage(project.image);
      setNewProjectAverageResponseTime(project.averageResponseTime);
      setModalType('updateProject');
      setModalVisible(true);
    }
  };

  const openUpdateDepartmentModal = (departmentId) => {
    const department = departments.find(d => d.id === departmentId);
    if (department) {
      setSelectedDepartmentId(departmentId);
      setNewDepartmentName(department.departmentName);
      setNewDepartmentDescription(department.description);
      setModalType('updateDepartment');
      setModalVisible(true);
    }
  };

  const openAddProjectModal = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectImage('');
    setNewProjectAverageResponseTime('');
    setModalType('project');
    setModalVisible(true);
  };

  const openAddDepartmentModal = () => {
    setNewDepartmentName('');
    setNewDepartmentDescription('');
    setModalType('department');
    setModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        questionId: parseInt(questionId, 10),
        answerText: answer,
        userId: userId // Make sure this is included
      };
      
      console.log("Sending answer payload:", payload);
      
      const response = await answersApi.create(payload);
      // Rest of your code...
    } catch (error) {
      // Error handling...
    }
  };

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {operationError && (
        <div className="operation-error-message">
          <button className="close-button" onClick={() => setOperationError(null)}>×</button>
          {operationError}
        </div>
      )}
      {operationSuccess && (
        <div className="operation-success-message">
          <button className="close-button" onClick={() => setOperationSuccess(null)}>×</button>
          {operationSuccess}
        </div>
      )}

      {Array.isArray(departments) && departments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', margin: '50px' }}>
          <h2>No departments have been added to {businessName}</h2>
          {(role === 'ADMIN' || isBusinessOwner === 'yes') && (
            <button onClick={openAddDepartmentModal}>Add Department</button>
          )}
        </div>
      )}

      {Array.isArray(departments) && departments.length > 0 && (
        <DepartmentProjectsGrid
          departments={departments}
          projects={projects}
          role={role}
          isBusinessOwner={isBusinessOwner}
          onOpenUpdateDepartmentModal={openUpdateDepartmentModal}
          onDeleteDepartment={deleteDepartment}
          onOpenUpdateProjectModal={openUpdateProjectModal}
          onDeleteProject={deleteProject}
          onOpenAddProjectModal={openAddProjectModal}
          onOpenAddDepartmentModal={openAddDepartmentModal}
          businessName={businessName}
        />
      )}

      {modalVisible && (
        <>
          {modalType === 'project' && (
            <ProjectModal
              onClose={() => setModalVisible(false)}
              onSubmit={() => addProject(selectedDepartmentId)}
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
          {modalType === 'department' && (
            <DepartmentModal
              onClose={() => setModalVisible(false)}
              onSubmit={addDepartment}
              departmentName={newDepartmentName}
              setDepartmentName={setNewDepartmentName}
              departmentDescription={newDepartmentDescription}
              setDepartmentDescription={setNewDepartmentDescription}
              isUpdate={false}
            />
          )}
          {modalType === 'updateProject' && (
            <ProjectModal
              onClose={() => setModalVisible(false)}
              onSubmit={() => updateProject(selectedProjectId)}
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
          {modalType === 'updateDepartment' && (
            <DepartmentModal
              onClose={() => setModalVisible(false)}
              onSubmit={() => updateDepartment(selectedDepartmentId)}
              departmentName={newDepartmentName}
              setDepartmentName={setNewDepartmentName}
              departmentDescription={newDepartmentDescription}
              setDepartmentDescription={setNewDepartmentDescription}
              isUpdate={true}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DepartmentProjectManagementPage;
