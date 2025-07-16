// AdminDashboardPage.js

import './AdminDashboardPage.css';
import React, { useEffect, useState, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { useUserContext } from "../context/LoginContext";
import Fuse from 'fuse.js';
import SearchBar from '../Components/Searchbar';
import Accordion from '../Components/Accordion';
import { admins as adminsApi, departments as departmentsApi, users as usersApi, projects as projectsApi, permissions as permissionsApi, setAuthToken } from "../services/ApiService";
import Tooltip from '../Components/Tooltip';
import { useSidebarContext } from '../context/SidebarContext.jsx';

const AdminDashboardPage = () => {
    const { token, stateBusinessId, role } = useUserContext();
    const { setActiveSidebarType } = useSidebarContext();
    const [hoveredExpertId, setHoveredExpertId] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [experts, setExperts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [toggleStates, setToggleStates] = useState({});
    const [isPermissionFormVisible, setIsPermissionFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        selectedDepartment: '',
        selectedProject: '',
        selectedUser: '',
        canAnswer: false
    });
    const [stateAdmin, setStateAdmin] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordionId, setOpenAccordionId] = useState(null);
    const [helpModeEnabled, setHelpModeEnabled] = useState(false);

    // Fuse.js options for fuzzy search - include email
    const fuseOptions = {
        keys: ['name', 'email'],
        threshold: 0.3
    };

    // Create fuse instance for searching experts
    const fuse = new Fuse(experts, fuseOptions);

    // Get filtered experts based on search - limit to top 10
    const getFilteredExperts = () => {
        if (!searchQuery) return experts.slice(0, 10);
        return fuse.search(searchQuery).map(result => result.item).slice(0, 10);
    };

    // Fetch data on component mount and token change
    useEffect(() => {
        if (role !== "ROLE_ADMIN") {
            console.warn("Non-admin attempting to access Admin Dashboard.");
        }
        if (token && stateBusinessId) {
            setAuthToken(token); // Set the auth token for all future requests
            fetchAndSetData();
        }
    }, [token, stateBusinessId]);

    useEffect(() => {
        setActiveSidebarType('userActions');
    }, [setActiveSidebarType]);

    // Combined function to fetch initial data
    const fetchAndSetData = async () => {
        await fetchAdminData();
        Promise.all([
            fetchDepartments(),
            fetchExperts(),
            fetchProjects(),
            fetchPermissions()
        ]).catch(error => {
            console.error("Error during parallel data fetching:", error);
        });
    };

    const fetchAdminData = async () => {
        try {
            const response = await adminsApi.getAll();
            const filteredAdmin = response.data.filter(admin => admin.businessId === stateBusinessId);
            setStateAdmin(filteredAdmin);
        } catch (error) {
            console.error('Error fetching Admin:', error);
            throw error;
        }
    };

    // Fetch departments for the current business
    const fetchDepartments = async () => {
        if (!stateBusinessId) return;
        try {
            const response = await departmentsApi.getByBusiness(stateBusinessId);
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setDepartments([]);
        }
    };

    // Fetch experts for the current business and filter out admins
    const fetchExperts = async () => {
        if (!stateBusinessId) return;
        try {
            const response = await usersApi.getByBusinessId(stateBusinessId);

            // Extract admin userIds
            const adminUserIds = stateAdmin.map(admin => admin.userId);

            // Filter experts whose userId is NOT in adminUserIds
            const filteredExperts = (response.data || []).filter(expert => !adminUserIds.includes(expert.userId));

            setExperts(filteredExperts);
        } catch (error) {
            console.error('Error fetching experts:', error);
            setExperts([]);
        }
    };

    // Fetch projects for the current business
    const fetchProjects = async () => {
        if (!stateBusinessId) return;
        try {
            const response = await projectsApi.getByBusinessId(stateBusinessId);
            setProjects(response.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        }
    };

    // Fetch permissions
    const fetchPermissions = async () => {
        try {
            const response = await permissionsApi.getAll();
            setPermissions(response.data);
            initializeToggleStates(response.data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    // Initialize toggle states
    const initializeToggleStates = (permissionsData) => {
        const newToggleStates = {};
        permissionsData.forEach(permission => {
            const toggleId = createToggleId(permission.departmentId, permission.projectId, permission.userId);
            newToggleStates[toggleId] = permission.canAnswer;
        });
        setToggleStates(newToggleStates);
    };

    // Create toggle ID
    const createToggleId = (departmentId, projectId, userId) =>
        `${departmentId || 'dept'}-${projectId || 'proj'}-${userId}`;

    // Handle permission toggle
    const handleToggle = async (deptIndex, expertIndex, projectId = null) => {
        const department = departments[deptIndex];
        const expert = experts[expertIndex];
        const toggleId = createToggleId(department.departmentId, projectId, expert.userId);

        const newCanAnswer = !toggleStates[toggleId];
        const previousToggleStates = { ...toggleStates };

        // Update toggle state optimistically
        setToggleStates(prevStates => ({
            ...prevStates,
            [toggleId]: newCanAnswer
        }));

        try {
            const existingPermission = permissions.find(permission =>
                permission.userId === expert.userId &&
                permission.departmentId === department.departmentId &&
                permission.projectId === projectId
            );

            if (existingPermission) {
                await permissionsApi.patch(existingPermission.permissionId, {
                    userId: expert.userId,
                    departmentId: department.departmentId,
                    projectId: projectId,
                    canAnswer: newCanAnswer
                });
            } else {
                const response = await permissionsApi.create({
                    userId: expert.userId,
                    departmentId: department.departmentId,
                    projectId: projectId,
                    canAnswer: newCanAnswer
                });
                setPermissions([...permissions, response.data]);
            }
        } catch (error) {
            console.error('Error updating permission:', error);
            setToggleStates(previousToggleStates);
        }
    };

    // Show permission form
    const handleAddPermission = () => setIsPermissionFormVisible(true);

    // Submit new permission
    const submitPermission = async () => {
        const { selectedUser, selectedDepartment, selectedProject, canAnswer } = formData;
        if (selectedUser && selectedDepartment) {
            try {
                await permissionsApi.create({
                    userId: selectedUser,
                    departmentId: selectedDepartment,
                    projectId: selectedProject || null,
                    canAnswer
                });
                fetchPermissions();
                setIsPermissionFormVisible(false);
                resetForm();
            } catch (error) {
                console.error('Error adding permission:', error);
            }
        } else {
            alert("Please select a user and a department.");
        }
    };

    // Reset form data
    const resetForm = () => setFormData({
        selectedDepartment: '',
        selectedProject: '',
        selectedUser: '',
        canAnswer: false
    });

    // Update form data
    const updateFormData = (field, value) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    // Function to handle accordion toggle
    const handleAccordionToggle = (departmentId) => {
        if (openAccordionId === departmentId) {
            setOpenAccordionId(null); // Close if clicked on already open accordion
        } else {
            setOpenAccordionId(departmentId); // Open the clicked accordion
        }
    };

    return (
        <div className={`admin-dashboard-container`}>
            <main className={`admin-dashboard ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
                <Helmet>
                    <title>Admin Dashboard | SupportHub</title>
                    <meta name="description" content="Manage expert permissions, assign specialists to departments and projects, and control access to customer support answers." />
                    <meta name="robots" content="noindex" /> {/* Optional: for private dashboards */}
                    <script type="application/ld+json">
                        {`
                            {
                                "@context": "https://schema.org",
                                "@type": "WebPage",
                                "name": "Admin Dashboard",
                                "description": "Manage expert permissions and assign specialists",
                                "breadcrumb": {
                                    "@type": "BreadcrumbList",
                                    "itemListElement": [
                                        {
                                            "@type": "ListItem",
                                            "position": 1,
                                            "name": "Admin Dashboard",
                                            "item": "https://yourdomain.com/admin-dashboard"
                                        }
                                    ]
                                }
                            }
                        `}
                    </script>
                </Helmet>

                <header className="dashboard-header">
                    <h1 className="dashboard-title">Admin Dashboard</h1>
                    <p className="dashboard-subtitle">
                        Grant targeted access to experts and agents for answering tickets related to specific topics or entire expertise areas.
                    </p>
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

                <section className="search-section" aria-label="Search experts">
                    <div className="search-wrapper">
                        <Tooltip text="Search for experts by their name or email address">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search experts to assign to topics..."
                                aria-label="Search experts"
                            />
                        </Tooltip>
                    </div>
                </section>

                <section 
                    className="departments-section" 
                    aria-label="Expertise Areas and permissions"
                    data-tooltip="Click on an expertise area to expand it and manage permissions for experts"
                >
                    <div className="department-grid">
                        {departments.map((department, deptIndex) => (
                            <Accordion 
                                key={department.departmentId} 
                                title={department.departmentName}
                                isOpen={openAccordionId === department.departmentId}
                                onToggle={() => handleAccordionToggle(department.departmentId)}
                                titleTooltip={`Click to expand/collapse the ${department.departmentName} expertise area. Here you can manage which experts can answer questions for this expertise area and its specific topics.`}
                            >
                                <div className="experts-list" role="list">
                                    
                                    <ul className="experts-container">
                                        {getFilteredExperts().map((expert, expertIndex) => {
                                            const departmentToggleId = createToggleId(department.departmentId, null, expert.userId);

                                            return (
                                                <li
                                                    key={expert.userId}
                                                    className="expert-item"
                                                    onMouseEnter={() => setHoveredExpertId(expert.userId)}
                                                    onMouseLeave={() => setHoveredExpertId(null)}
                                                    role="listitem"
                                                    data-tooltip={`${expert.name} - ${expert.role} specialist`}
                                                >
                                                    <div className='expert-item-container'>
                                                        <span className="expert-name">{expert.name}</span>
                                                        <span className="expert-email">{expert.email}</span>
                                                        <span className="expert-role">{expert.role}</span>
                                                    </div>

                                                    {hoveredExpertId === expert.userId && (
                                                        <div className='section_projects_container' role="group" aria-label={`Topics for ${expert.name}`}>
                                                            <div className="tooltip-container" data-tooltip="Toggle permissions for specific topics">
                                                                {projects.filter(project => project.departmentId === department.departmentId).map(project => {
                                                                    const projectToggleId = createToggleId(department.departmentId, project.projectId, expert.userId);
                                                                    return (
                                                                        <div key={project.projectId} className="project-permission">
                                                                            <span className="project-name">{project.name}</span>
                                                                            <button
                                                                                className={`toggleButton ${toggleStates[projectToggleId] ? "active" : ""}`}
                                                                                onClick={() => handleToggle(deptIndex, expertIndex, project.projectId)}
                                                                                aria-pressed={toggleStates[projectToggleId]}
                                                                                aria-label={`Toggle permission for ${expert.name} on ${project.name} topic`}
                                                                                data-tooltip={toggleStates[projectToggleId] ? 
                                                                                    `Click to remove ${expert.name}'s permission to answer questions for ${project.name} topic` : 
                                                                                    `Click to grant ${expert.name} permission to answer questions for ${project.name} topic`}
                                                                                data-tooltip-position="left"
                                                                            >
                                                                                <div className="toggle-circle"></div>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </Accordion>
                        ))}
                    </div>
                </section>

                {isPermissionFormVisible && (
                    <dialog open className="permission-form" aria-labelledby="permission-form-title">
                        <h3 id="permission-form-title">Add New Permission</h3>
                        <form onSubmit={(e) => { e.preventDefault(); submitPermission(); }}>
                            <div className="tooltip-container" data-tooltip="Select the user who needs permissions">
                                <label htmlFor="user-select">Select User</label>
                                <select 
                                    id="user-select"
                                    value={formData.selectedUser} 
                                    onChange={(e) => updateFormData('selectedUser', e.target.value)}
                                    required
                                >
                                    <option value="">Select User</option>
                                    {experts.map(expert => (
                                        <option key={expert.userId} value={expert.userId}>{expert.name} ({expert.email})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="tooltip-container" data-tooltip="Select which expertise area this permission applies to">
                                <label htmlFor="department-select">Select Expertise Area</label>
                                <select 
                                    id="department-select"
                                    value={formData.selectedDepartment} 
                                    onChange={(e) => updateFormData('selectedDepartment', e.target.value)}
                                    required
                                >
                                    <option value="">Select Expertise Area</option>
                                    {departments.map(department => (
                                        <option key={department.departmentId} value={department.departmentId}>{department.departmentName}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="tooltip-container" data-tooltip="Optionally limit permission to a specific topic within the expertise area">
                                <label htmlFor="project-select">Select Topic (optional)</label>
                                <select 
                                    id="project-select"
                                    value={formData.selectedProject} 
                                    onChange={(e) => updateFormData('selectedProject', e.target.value)}
                                >
                                    <option value="">Select Topic (optional)</option>
                                    {projects
                                        .filter(project => project.departmentId === formData.selectedDepartment)
                                        .map(project => (
                                            <option key={project.projectId} value={project.projectId}>{project.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            
                            <div className="tooltip-container" data-tooltip="When checked, the user will be able to answer customer questions">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.canAnswer}
                                        onChange={() => updateFormData('canAnswer', !formData.canAnswer)}
                                        id="can-answer"
                                    />
                                    Can Answer
                                </label>
                            </div>
                            
                            <div className="form-buttons">
                                <button type="submit" data-tooltip="Save this permission configuration">Submit Permission</button>
                                <button type="button" onClick={() => setIsPermissionFormVisible(false)}>Cancel</button>
                            </div>
                        </form>
                    </dialog>
                )}
            </main>
        </div>
    );
};

export default AdminDashboardPage;

