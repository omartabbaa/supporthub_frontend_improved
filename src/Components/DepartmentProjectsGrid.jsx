// DepartmentProjectsGrid.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Update from '../assets/Button/sign-up-icon.png';
import "./DepartmentProjectsGrid.css";
import QuestionCountBubble from './QuestionCountBubble';
import { useUserPermissions } from '../hooks/useUserPermissions';
import Tooltip from './Tooltip';
"use client"

// Create a simple utility for consistent naming
const uiTerms = {
  department: "Expertise Area",
  departments: "Expertise Areas",
  project: "Topic",
  projects: "Topics"
};

const DepartmentProjectsGrid = ({
  departments,
  projects,
  role,
  isBusinessOwner,
  onOpenUpdateDepartmentModal,
  onDeleteDepartment,
  onOpenUpdateProjectModal,
  onDeleteProject,
  onOpenAddProjectModal,
  onOpenAddDepartmentModal,
  businessName,
  singleDepartmentView = false
}) => {
  const { hasProjectPermission } = useUserPermissions();

  const positionTooltip = (e) => {
    const tooltip = e.currentTarget.querySelector("::after");
    if (tooltip) {
      // Set custom properties that the CSS will use
      e.currentTarget.style.setProperty('--tooltip-x', `${e.clientX}px`);
      e.currentTarget.style.setProperty('--tooltip-y', `${e.clientY + 20}px`);
    }
  };

  return (
    <div>
      <div className="DepartmentProjectManagementPageHeader">
        <div className="BusinessTitleWrapper">
          <h1 className="DepartmentProjectManagementPageTitle">{businessName}</h1>
          <div className="BusinessTypeLabel">Organization</div>
        </div>
      </div>

      {departments.map((department, index) => (
        <div key={`dept-${department.id || index}`}>
          <div className='DepartmentHeader'>
            {!singleDepartmentView && (role === "ROLE_ADMIN" || isBusinessOwner === "yes") && (
              <div className='DepartmentButtons'>
                <button 
                  className='UpdateDepartmentButton' 
                  onClick={() => onOpenUpdateDepartmentModal(department.id, department.departmentName)}
                >
                  <img className='UpdateImage' src={Update} alt="Update" />
                </button>
                <button 
                  className='DeleteDepartmentButton' 
                  onClick={() => onDeleteDepartment(department.id)}
                >
                  X
                </button>
              </div>
            )}
            <div className="DepartmentTitleWrapper">
              <h2 className='DepartmentTitle'>{department.departmentName}</h2>
              <div className="DepartmentTypeLabel">{uiTerms.department}</div>
            </div>
          </div>
          <div className='ProjectContainer'>
            {projects
              .filter(project => project.departmentId === department.id)
              .map((project) => {
                // Check if user has permission for this project
                const hasPermission = hasProjectPermission(project.projectId);
                
                return (
                  <div className='ProjectCardContainer' key={`proj-${project.projectId}`}>
                    <div className={`ProjectCard ${!hasPermission ? 'no-permission' : ''}`}>
                      {role === "ROLE_ADMIN" && isBusinessOwner === "yes" && (
                        <div className='ButtonsContainer'>
                          <button 
                            className='UpdateProjectButton' 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent event bubbling
                              onOpenUpdateProjectModal(department.id, project.projectId);
                            }}
                            onMouseMove={positionTooltip}
                          >
                            <img className='UpdateImage' src={Update} alt="Update" />
                          </button>
                          <button 
                            className='DeleteProjectButton' 
                            onClick={() => onDeleteProject(project.projectId)}
                            onMouseMove={positionTooltip}
                          >
                            X
                          </button>
                        </div>
                      )}
                      <Link 
                        to={`/question-overview/${encodeURIComponent(businessName)}/${encodeURIComponent(department.departmentName)}/${encodeURIComponent(project.name)}/${project.projectId}`}
                        className="project-link"
                      >
                        <div className='image-Component' style={{ position: 'relative' }}>
                          {project.image || project.imageUrl ? (
                            <img 
                              className="ProjectImage" 
                              src={project.image || project.imageUrl} 
                              alt={`${project.name} image`}
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://via.placeholder.com/150/e2e8f0/2d3748?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="ProjectImagePlaceholder">No Image</div>
                          )}
                          <QuestionCountBubble projectId={project.projectId} />
                          {!hasPermission && (
                            <div className="no-permission-overlay">
                              <span>No Answer Permission</span>
                            </div>
                          )}
                        </div>
                        <div className='TitleProjectWrapper'>
                          <div className='TitleProject'>{project.name}</div>
                          <div className="ProjectTypeLabel">{uiTerms.project}</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })}
            {projects.filter(project => project.departmentId === department.id).length === 0 && (
              <div className='NoProjectsMessage'>
                No projects have been added to this department yet.
              </div>
            )}
            {role === "ROLE_ADMIN" && isBusinessOwner === "yes" && (
              <div className='ProjectContainerBox'>
                <button 
                  className='AddProjectButton' 
                  onClick={() => onOpenAddProjectModal(department.id)}
                >
                  <div className='AddProject'>+</div>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {!singleDepartmentView && (role === "ROLE_ADMIN" || isBusinessOwner === "yes") && (
        <div className="add-department-container">
          <Tooltip text="Create a new department to organize projects">
            <button 
              className="add-department-button"
              onClick={onOpenAddDepartmentModal}
            >
              Add Department
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default DepartmentProjectsGrid;
