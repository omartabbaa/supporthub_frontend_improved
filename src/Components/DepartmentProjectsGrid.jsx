// DepartmentProjectsGrid.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Update from '../assets/Button/sign-up-icon.png';
import "./DepartmentProjectsGrid.css";

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
  businessName
}) => {
  return (
    <div>
      <div className="DepartmentProjectManagementPageHeader">
        <h1 className="DepartmentProjectManagementPageTitle">{businessName}</h1>
      </div>

      {departments.map((department, index) => (
        <div key={`dept-${department.id || index}`}>
          <div className='DepartmentHeader'>
            {role === "ROLE_ADMIN" && isBusinessOwner === "yes" && (
              <div className='DepartmentButtons'>
                <button 
                  className='UpdateDepartmentButton' 
                  onClick={() => onOpenUpdateDepartmentModal(department.id, department.departmentName)}
                >
                  <img className='UpdateImage' src={Update} alt="Update" />Update Department
                </button>
                <button 
                  className='DeleteDepartmentButton' 
                  onClick={() => onDeleteDepartment(department.id)}
                >
                  X
                </button>
              </div>
            )}
            <h2 className='DepartmentTitle'>{department.departmentName}</h2>
          </div>
          <div className='ProjectContainer'>
            {projects
              .filter(project => project.departmentId === department.id)
              .map((project) => (
                <div className='ProjectCardContainer' key={`proj-${project.projectId}`}>
                  <div className='ProjectCard'>
                    {role === "ROLE_ADMIN" && isBusinessOwner === "yes" && (
                      <div className='ButtonsContainer'>
                        <button 
                          className='UpdateProjectButton' 
                          onClick={() => onOpenUpdateProjectModal(department.id, project.projectId, project.name)}
                        >
                          <img className='UpdateImage' src={Update} alt="Update" />
                        </button>
                        <button 
                          className='DeleteProjectButton' 
                          onClick={() => onDeleteProject(project.projectId)}
                        >
                          X
                        </button>
                      </div>
                    )}
                    <Link to={`/question-overview/${encodeURIComponent(department.departmentName)}/${encodeURIComponent(project.name)}/${project.projectId}`}>
                      <div className='image-Component'>
                        <img className='ProjectImage' src={project.image} alt={project.name} />
                      </div>
                      <div className='TitleProject'>{project.name}</div>
                    </Link>
                  </div>
                </div>
            ))}
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
                <div className='projectDescription'>
                  By adding a project you can manage your questions
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {role === "ROLE_ADMIN" && isBusinessOwner === "yes" && (
        <>
          <button 
            className='AddDepartmentButton' 
            onClick={onOpenAddDepartmentModal}
          >
            +
          </button>
          <div className='DepartmentDescription'>
            By adding a Question category also referred to as department you can manage your projects
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentProjectsGrid;
