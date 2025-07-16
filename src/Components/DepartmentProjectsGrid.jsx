// DepartmentProjectsGrid.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Update from '../assets/Button/sign-up-icon.png';
import "./DepartmentProjectsGrid.css";
import QuestionCountBubble from './QuestionCountBubble';
import { useUserPermissions } from '../hooks/useUserPermissions';
import Tooltip from './Tooltip';
import { useUserContext } from '../context/LoginContext';
import { useSubscriptionContext } from '../context/SubscriptionContext';

// Create a simple utility for consistent naming
const uiTerms = {
  department: "Expertise Area",
  departments: "Expertise Areas",
  project: "Topic",
  projects: "Topics"
};

const DepartmentProjectsGrid = (props) => {
  console.log("[DPG] 🔄 Component Rendered/Re-rendered", {
    timestamp: new Date().toISOString(),
    permissionRefreshTrigger: props.permissionRefreshTrigger,
    propKeys: Object.keys(props),
    propsObject: props
  });

  const {
    departments,
    projects,
    projectPermissions,
    role,
    isBusinessOwner,
    onOpenUpdateDepartmentModal,
    onDeleteDepartment,
    onOpenUpdateProjectModal,
    onDeleteProject,
    onOpenAddProjectModal,
    onOpenAddDepartmentModal,
    onOpenModal,
    businessName: DPGbusinessName,
    singleDepartmentView = false,
    helpModeEnabled,
    currentDepartmentId,
    permissionRefreshTrigger,
  } = props;

  const { getUserPermissions, hasPermission: checkUserPermission, hasProjectPermission, refreshUserPermissions } = useUserPermissions();
  const { userId, token } = useUserContext();
  const [openDropdownProjectId, setOpenDropdownProjectId] = useState(null);
  const dropdownContainerRef = useRef(null); // Used for click-outside-to-close
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const { maxProjectsPerDepartment } = useSubscriptionContext();

  // Check if onOpenModal is a function, to be used for conditional rendering/disabling
  const canOpenModals = typeof onOpenModal === 'function';

  // Add useEffect to monitor projectPermissions changes
  useEffect(() => {
    console.log('[DPG] projectPermissions prop changed:', projectPermissions);
    console.log('[DPG] projectPermissions length:', projectPermissions?.length || 0);
    if (projectPermissions && projectPermissions.length > 0) {
      console.log('[DPG] First project permissions:', projectPermissions[0]);
    }
  }, [projectPermissions]);

  // Console log max projects value
  useEffect(() => {
    console.log('[DPG] Max Projects Per Department:', maxProjectsPerDepartment);
    console.log('[DPG] Max Projects Type:', typeof maxProjectsPerDepartment);
    console.log('[DPG] Is Unlimited:', maxProjectsPerDepartment === -1);
  }, [maxProjectsPerDepartment]);

  useEffect(() => {
    console.log("[DPG] useEffect triggered. Full props object:", props);
    console.log("[DPG] useEffect - Directly checking props.onOpenModal:", props.onOpenModal);
    console.log("[DPG] useEffect - typeof props.onOpenModal:", typeof props.onOpenModal);
    
    // Check the destructured onOpenModal as well
    console.log("[DPG] useEffect - typeof destructured onOpenModal:", typeof onOpenModal);

    if (!canOpenModals) {
      console.warn("[DPG] WARNING IN useEffect: onOpenModal is NOT a function. Modal-triggering actions will be disabled or hidden.");
    }
    // Removed 'props' from dependency array to avoid excessive re-runs.
    // Only include specific props that should trigger this effect if they change.
    // For this logging purpose, [onOpenModal] is sufficient if you only care about its changes.
    // If DPGbusinessName is also relevant for this log's context, add it.
  }, [onOpenModal, DPGbusinessName, canOpenModals]);

  // Add useEffect to refresh permissions when trigger changes
  useEffect(() => {
    console.log('[DPG] 🚨 Permission refresh trigger useEffect called:', {
      permissionRefreshTrigger,
      previousTrigger: 'N/A', // We don't track previous value
      triggerType: typeof permissionRefreshTrigger,
      triggerGreaterThanZero: permissionRefreshTrigger > 0,
      hasRefreshFunction: typeof refreshUserPermissions === 'function',
      timestamp: new Date().toISOString()
    });

    if (permissionRefreshTrigger && permissionRefreshTrigger > 0 && refreshUserPermissions) {
      console.log('[DPG] ✅ Permission refresh triggered, refreshing user permissions...', {
        triggerValue: permissionRefreshTrigger,
        timestamp: new Date().toISOString()
      });
      
      refreshUserPermissions()
        .then(() => {
          console.log('[DPG] 🎉 Permission refresh completed successfully');
        })
        .catch((error) => {
          console.error('[DPG] ❌ Permission refresh failed:', error);
        });
    } else {
      console.log('[DPG] ⏭️ Permission refresh skipped:', {
        reason: !permissionRefreshTrigger || permissionRefreshTrigger <= 0 
          ? 'trigger not set or <= 0' 
          : 'no refresh function',
        permissionRefreshTrigger,
        hasRefreshFunction: typeof refreshUserPermissions === 'function'
      });
    }
  }, [permissionRefreshTrigger, refreshUserPermissions]);

  const positionTooltip = (e) => {
    const tooltip = e.currentTarget.querySelector("::after");
    if (tooltip) {
      // Set custom properties that the CSS will use
      e.currentTarget.style.setProperty('--tooltip-x', `${e.clientX}px`);
      e.currentTarget.style.setProperty('--tooltip-y', `${e.clientY + 20}px`);
    }
  };

  const toggleDropdown = (e, projectId) => {
    e.stopPropagation(); // Prevent event bubbling
    setOpenDropdownProjectId(prev => (prev === projectId ? null : projectId));
  };

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownContainerRef.current && 
          !dropdownContainerRef.current.contains(event.target) &&
          !event.target.closest('.project-actions-trigger')) { // Avoid closing if trigger is clicked again
        setOpenDropdownProjectId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Improved function to create project details
  const createProjectDetails = useCallback((project, department) => {
    return {
      projectId: project.projectId,
      name: project.name || project.projectName,
      projectName: project.name || project.projectName, // Fallback for consistency
      departmentName: department.departmentName,
      departmentId: project.departmentId || department.id,
    };
  }, []);

  // Improved modal handler with validation
  const handleModalOpen = useCallback((modalType, project, department) => {
    console.log(`[DPG] Opening ${modalType} modal for project:`, project.projectId);
    
    if (!canOpenModals) { // Use the pre-calculated boolean
      console.error('[DPG] onOpenModal is not a function. Cannot open modal.', typeof onOpenModal);
      // Optionally, provide user feedback here, e.g., an alert or a state update for an error message
      alert("This action is currently unavailable.");
      return;
    }

    const projectDetails = createProjectDetails(project, department);
    
    // Validate required fields based on modal type
    if (modalType === 'manageAgents' && !projectDetails.departmentId) {
      console.error('[DPG] Missing departmentId for manageAgents modal');
      alert("Error: Department information is missing for this project.");
      return;
    }

    console.log(`[DPG] Calling onOpenModal with:`, { modalType, projectDetails });
    onOpenModal(modalType, projectDetails);
    setOpenDropdownProjectId(null);
  }, [onOpenModal, createProjectDetails, canOpenModals]);

  // Add function to get permissions for a specific project
  const getProjectPermissions = useCallback((projectId) => {
    console.log(`[DPG] getProjectPermissions called for project ${projectId}`);
    console.log(`[DPG] projectPermissions prop:`, projectPermissions);
    
    if (!projectPermissions || !Array.isArray(projectPermissions)) {
      console.log(`[DPG] No projectPermissions or not an array for project ${projectId}`);
      return [];
    }
    
    const projectPermissionData = projectPermissions.find(p => p.projectId === projectId);
    console.log(`[DPG] Found permission data for project ${projectId}:`, projectPermissionData);
    
    const permissions = projectPermissionData ? projectPermissionData.permissions : [];
    console.log(`[DPG] Returning permissions for project ${projectId}:`, permissions);
    return permissions;
  }, [projectPermissions]);

  // Add function to get agent counts for a specific project
  const getProjectAgentCounts = useCallback((projectId) => {
    console.log(`[DPG] getProjectAgentCounts called for project ${projectId}`);
    
    if (!projectPermissions || !Array.isArray(projectPermissions)) {
      console.log(`[DPG] No projectPermissions or not an array for project ${projectId}`);
      return { total: 0, active: 0, inactive: 0 };
    }
    
    const projectPermissionData = projectPermissions.find(p => p.projectId === projectId);
    console.log(`[DPG] Found permission data for project ${projectId}:`, projectPermissionData);
    
    if (!projectPermissionData || !projectPermissionData.agentCounts) {
      console.log(`[DPG] No agent counts found for project ${projectId}`);
      return { total: 0, active: 0, inactive: 0 };
    }
    
    const counts = projectPermissionData.agentCounts;
    console.log(`[DPG] Returning agent counts for project ${projectId}:`, counts);
    return counts;
  }, [projectPermissions]);

  // Add function to get agents who can answer for a project
  const getProjectAgents = useCallback((projectId) => {
    const permissions = getProjectPermissions(projectId);
    const agentsWithPermission = permissions.filter(permission => permission.canAnswer);
    console.log(`[DPG] Project ${projectId} has ${agentsWithPermission.length} agents with permission:`, agentsWithPermission);
    return agentsWithPermission;
  }, [getProjectPermissions]);

  // Add function to get count of active agents for a project
  const getProjectAgentCount = useCallback((projectId) => {
    const counts = getProjectAgentCounts(projectId);
    const activeCount = counts.active || 0;
    console.log(`[DPG] Project ${projectId} active agent count: ${activeCount}`);
    return activeCount;
  }, [getProjectAgentCounts]);

  // Add function to get count of inactive agents for a project
  const getProjectInactiveAgentCount = useCallback((projectId) => {
    const counts = getProjectAgentCounts(projectId);
    const inactiveCount = counts.inactive || 0;
    console.log(`[DPG] Project ${projectId} inactive agent count: ${inactiveCount}`);
    return inactiveCount;
  }, [getProjectAgentCounts]);

  // Add function to get total agent count for a project
  const getProjectTotalAgentCount = useCallback((projectId) => {
    const counts = getProjectAgentCounts(projectId);
    const totalCount = counts.total || 0;
    console.log(`[DPG] Project ${projectId} total agent count: ${totalCount}`);
    return totalCount;
  }, [getProjectAgentCounts]);

  // Add logging to track hasProjectPermission calls
  const loggedHasProjectPermission = useCallback((projectId) => {
    console.log('[DPG] 🔍 Checking project permission for project:', projectId);
    const result = hasProjectPermission(projectId);
    console.log('[DPG] 🎯 Project permission result:', { projectId, hasPermission: result });
    return result;
  }, [hasProjectPermission]);

  // Helper function to get accessible projects count for a department
  const getAccessibleProjectsCount = useCallback((departmentId) => {
    const departmentProjects = projects.filter(p => String(p.departmentId) === String(departmentId) || String(p.department_id) === String(departmentId));
    const accessibleProjects = departmentProjects.filter(project => 
      role === 'ROLE_ADMIN' || loggedHasProjectPermission(project.projectId)
    );
    return accessibleProjects.length;
  }, [projects, role, loggedHasProjectPermission]);

  // Helper function to render projects for a department
  const renderProjectsForDepartment = (department) => {
    // console.log(`[DPG] renderProjectsForDepartment for department "${department.departmentName}" (ID: ${department.id}). BusinessName prop value: "${businessName}", type: ${typeof businessName}`);
    // console.log(`[DPG]   Inside renderProjectsForDepartment - typeof onOpenUploadDataModal: ${typeof onOpenUploadDataModal}`);
    // console.log(`[DPG]   Inside renderProjectsForDepartment - typeof onOpenQuestionOverviewModal: ${typeof onOpenQuestionOverviewModal}`);
    // console.log(`[DPG]   Inside renderProjectsForDepartment - typeof onOpenManageAgentsModal: ${typeof onOpenManageAgentsModal}`);

    const departmentProjects = projects.filter(p => String(p.departmentId) === String(department.id) || String(p.department_id) === String(department.id));
    
    // Filter out projects where user has no permission (unless they're admin)
    const accessibleProjects = departmentProjects.filter(project => 
      role === 'ROLE_ADMIN' || loggedHasProjectPermission(project.projectId)
    );

    return accessibleProjects.map(project => (
                  <div className='ProjectCardContainer' key={`proj-${project.projectId}`}>
        <div className="ProjectCard">
                      {role === "ROLE_ADMIN" && (
                        <div className='ButtonsContainer'>
                          <button 
                            className='UpdateProjectButton' 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("[DPG] Update button clicked for project:", project.projectId, project.name);
                              onOpenUpdateProjectModal(department.id, project.projectId);
                            }}
                            onMouseMove={positionTooltip}
                            title={`Update ${project.name || 'project'}`}
                          >
                            <img className='UpdateImage' src={Update} alt="Update" />
                          </button>
                          <button 
                            className='DeleteProjectButton' 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("[DPG] Delete button clicked for project:", project.projectId);
                              onDeleteProject(project.projectId);
                            }}
                            onMouseMove={positionTooltip}
                            title={`Delete ${project.name || 'project'}`}
                          >
                            X
                          </button>
                        </div>
                      )}
                      <div className="project-content-wrapper">
                        <div className='image-Component' style={{ position: 'relative' }}>
                          <div className="ProjectCard-image-container">
                            <img
                              className="ProjectCard-image"
                              src={project.image || project.imageUrl || `https://via.placeholder.com/150/e2e8f0/2d3748?text=${encodeURIComponent(project.name || 'Project')}`}
                              alt={project.name || 'Project Image'}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop if the fallback itself had an issue
                                // Fallback to a self-contained SVG data URI if the external placeholder fails
                                e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20style%3D%22fill%3A%23e2e8f0%3B%22%20%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214px%22%20fill%3D%22%232d3748%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
                              }}
                            />
                          </div>
                          <QuestionCountBubble projectId={project.projectId} />
                        </div>
                        <div className='TitleProjectWrapper'>
                          <div className="ProjectTypeLabel">Manage knollgebase {uiTerms.project}:</div>
                          <div className='project-name'>{project.name}</div>
                        </div>
                        
                        {/* Add agent count display - Active and Inactive */}
                        <div className="project-agents-info">
                          <div className="agents-counts-container">
                            <div className="agent-count-item active">
                              <div className="agents-count-display">
                                <span className="agents-count-number active">{getProjectAgentCount(project.projectId)}</span>
                                <span className="agents-count-label">active</span>
                              </div>
                            </div>
                            <div className="agent-count-separator">|</div>
                            <div className="agent-count-item inactive">
                              <div className="agents-count-display">
                                <span className="agents-count-number inactive">{getProjectInactiveAgentCount(project.projectId)}</span>
                                <span className="agents-count-label">inactive</span>
                              </div>
                            </div>
                          </div>
                          <div className="agents-status">
                            {getProjectAgentCount(project.projectId) > 0 ? (
                              <span className="has-agents">
                                {getProjectAgentCount(project.projectId)} active of {getProjectTotalAgentCount(project.projectId)} total agents
                              </span>
                            ) : getProjectTotalAgentCount(project.projectId) > 0 ? (
                              <span className="no-active-agents">
                                {getProjectTotalAgentCount(project.projectId)} agents available, none active
                              </span>
                            ) : (
                              <span className="no-agents">No expert agents in this business</span>
                            )}
                          </div>
                        </div>
                      </div>
          <div 
            className="project-actions-menu-container" 
            ref={openDropdownProjectId === project.projectId ? dropdownContainerRef : null}
          >
                          <button
              className="project-actions-trigger"
              onClick={(e) => toggleDropdown(e, project.projectId)}
              aria-haspopup="true"
              aria-expanded={openDropdownProjectId === project.projectId}
              aria-label={`Actions for ${project.name || project.projectName}`}
              title="More actions"
            >
              {/* SVG for 3 vertical dots (ellipsis) icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                          </button>
            {openDropdownProjectId === project.projectId && (
              <div className="project-actions-dropdown">
                {/* Modal-related actions */}
                {canOpenModals && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModalOpen('uploadData', project, department);
                      }}
                      title="Upload data to teach the AI"
                    >
                      💡 Teach AI
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModalOpen('questionOverview', project, department);
                      }}
                      title="View and manage questions"
                    >
                      ❓ View Questions
                    </button>

                    {/* Only show Manage Agents for admins */}
                    {role === 'ROLE_ADMIN' && (
                      <button
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModalOpen('manageAgents', project, department);
                        }}
                        title="Manage project agents and permissions (Admin only)"
                      >
                        👥 Manage Agents
                      </button>
                    )}
                  </>
                )}
                {!canOpenModals && (
                  <div className="dropdown-item-disabled">
                    Modal actions unavailable.
                  </div>
                )}

                {/* Admin actions - Update and Delete */}
                {role === 'ROLE_ADMIN' && (
                  <>
                    {/* Divider should only appear if modal actions are shown AND admin actions are also shown */}
                    {canOpenModals && <div className="dropdown-divider"></div>}
                    <button
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("[DPG] Dropdown update clicked for project:", {
                          projectId: project.projectId,
                          name: project.name,
                          departmentId: department.id
                        });
                        onOpenUpdateProjectModal(department.id, project.projectId);
                        setOpenDropdownProjectId(null);
                      }}
                      title={`Update ${project.name || 'project'}`}
                    >
                      ✏️ Update Project
                    </button>
                    <button
                      className="dropdown-item danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.projectId);
                        setOpenDropdownProjectId(null);
                      }}
                    >
                      🗑️ Delete Project
                    </button>
                  </>
                )}
              </div>
            )}
                      </div>
                    </div>
                  </div>
    ));
  };

  return (
    <div>
      <div className="DepartmentProjectManagementPageHeader">
        <div className="BusinessTitleWrapper">
          <h1 className="DepartmentProjectManagementPageTitle">{DPGbusinessName}</h1>
          <div className="BusinessTypeLabel">Organization</div>
        </div>
      </div>

      {departments.map((department, index) => (
        <div key={`dept-${department.id || index}`}>
          <div className='DepartmentHeader'>
            {!singleDepartmentView && role === "ROLE_ADMIN" && 
             department.departmentName?.toLowerCase().trim() !== "default" && (
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
            {renderProjectsForDepartment(department)}
            {getAccessibleProjectsCount(department.id) === 0 && (
              <div className='NoProjectsMessage'>
                {department.departmentName?.toLowerCase().trim() === "default" ? 
                  "This is the default expertise area. It will automatically contain the default project for general inquiries." :
                  role === 'ROLE_ADMIN' ? 
                    "No projects have been added to this department yet." :
                    "No accessible projects in this department."
                }
              </div>
            )}
            {role === "ROLE_ADMIN" && 
             department.departmentName?.toLowerCase().trim() !== "default" && (
              <div className='ProjectContainerBox'>
                <div className='add-project-section'>
                  {(() => {
                    const departmentProjectCount = projects.filter(project => project.departmentId === department.id).length;
                    // Always coerce to number for robust comparison
                    const maxPerDeptNum = Number(maxProjectsPerDepartment);
                    let maxPerDept;
                    if (!isNaN(maxPerDeptNum) && maxPerDeptNum > 0) {
                      maxPerDept = maxPerDeptNum;
                    } else if (maxPerDeptNum === -1) {
                      maxPerDept = 'Unlimited';
                    } else {
                      maxPerDept = 'N/A';
                    }
                    const atLimit = (!isNaN(maxPerDeptNum) && maxPerDeptNum > 0)
                      ? departmentProjectCount >= maxPerDeptNum
                      : false;
                    return (
                      <>
                        <div className={`project-count-display ${atLimit ? 'limit-reached' : ''}`}>
                          <span className='project-count-number'>
                            {departmentProjectCount} / {maxPerDept}
                          </span>
                          <span className='project-count-label'>PROJECTS IN THIS DEPARTMENT</span>
                        </div>
                        <button 
                          className={`AddProjectButton ${atLimit ? 'disabled' : ''}`}
                          onClick={() => onOpenAddProjectModal(department.id)}
                          disabled={atLimit}
                          title={atLimit ? 
                            `Project limit reached for this department (${maxPerDept} projects maximum)` : 
                            'Add new project to this department'}
                        >
                          <div className='AddProject'>+</div>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}


    </div>
  );
};

export default DepartmentProjectsGrid;











