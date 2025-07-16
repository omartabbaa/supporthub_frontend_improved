import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import "./DepartmentProjectManagementPage.css";
import { useUserContext } from "../context/LoginContext";
import { useSubscriptionContext } from "../context/SubscriptionContext";
import ProjectModal from '../Components/ProjectModal';
import DepartmentModal from '../Components/DepartmentModal';
import DepartmentProjectsGrid from '../Components/DepartmentProjectsGrid';
import { departments as departmentsApi, projects as projectsApi, permissions as permissionsApi, setAuthToken } from '../services/ApiService';
import { stripeService } from '../services/StripeService';
import Tooltip from '../Components/Tooltip';
import UploadYourOwnData from './UploadYourOwnData';
import QuestionOverviewPage from './QuestionOverviewPage';
import ManageProjectAgentsModal from '../Components/ManageProjectAgentsModal';
import { useSidebarContext } from '../context/SidebarContext.jsx';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';

// Define uiTerms if it's not already present or imported
const uiTerms = {
  department: "Expertise Area",
  departments: "Expertise Areas",
  project: "Topic",
  projects: "Topics",
};

const DepartmentProjectManagementPage = () => {
  const { role, token, stateBusinessId } = useUserContext();
  const { setActiveSidebarType } = useSidebarContext();
  const { businessId, businessName, departmentId } = useParams();
  
  // Get subscription context values
  const {
    maxConversations,
    maxExperts,
    maxDepartments,
    maxProjectsPerDepartment,
    isLoading: subscriptionLoading,
    error: subscriptionError
  } = useSubscriptionContext();
  
  console.log(`[DPM] Page Loaded. Params: businessId: ${businessId}, businessName: ${businessName}, departmentId: ${departmentId}`);
  console.log('[DPM] Subscription Context Values:', {
    maxConversations,
    maxExperts,
    maxDepartments,
    maxProjectsPerDepartment,
    subscriptionLoading,
    subscriptionError
  });

  // Subscription limits hook
  const {
    canCreateProject,
    getProjectCreationStatus,
    projectsUsage,
    refreshProjectsUsage,
    refreshDepartmentsUsage,
    updateProjectsUsageImmediately,
    validateOperation
  } = useSubscriptionLimits();

  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectPermissions, setProjectPermissions] = useState([]); // Add permissions state
  const [legacyModalVisible, setLegacyModalVisible] = useState(false);
  const [legacyModalType, setLegacyModalType] = useState(null);
  const [error, setError] = useState(null);

  // Modal-related state for Add/Update Department/Project (legacy modals)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Inputs for Project Modal (legacy)
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectImage, setNewProjectImage] = useState('');
  const [newProjectAverageResponseTime, setNewProjectAverageResponseTime] = useState('');

  // Inputs for Department Modal (legacy)
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('');

  const [isBusinessOwner, setIsBusinessOwner] = useState('');

  const [operationError, setOperationError] = useState(null);
  const [operationSuccess, setOperationSuccess] = useState(null);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);

  // Unified state for managing active modal (Upload, Questions, Agents)
  const [activeModalInfo, setActiveModalInfo] = useState(null); // { type: string, data: object } | null

  const [isUploadSuccessful, setIsUploadSuccessful] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);

  // Add a flag to prevent multiple creation attempts
  const [isCreatingDefaultProject, setIsCreatingDefaultProject] = useState(false);

  // Add loading state for subscription refresh
  const [isRefreshingSubscription, setIsRefreshingSubscription] = useState(false);

  // Simple state for current projects count - directly from backend
  const [currentProjectsCount, setCurrentProjectsCount] = useState(0);

  // Real-time project counting and limit enforcement
  const [realTimeProjectsCount, setRealTimeProjectsCount] = useState(0);
  const [projectLimit, setProjectLimit] = useState(-1);
  
  // Add a refresh key to force re-renders when needed
  const [refreshKey, setRefreshKey] = useState(0);

  // Usage counters for all subscription metrics
  const [usageCounters, setUsageCounters] = useState({
    conversationsCount: 0,
    expertsCount: 0,
    departmentsCount: 0,
    projectsCount: 0
  });

  // Permission refresh trigger for communicating with DepartmentProjectsGrid
  const [permissionRefreshTrigger, setPermissionRefreshTrigger] = useState(0);

  // Add state for actual subscription plan limits from Stripe
  const [actualSubscriptionLimits, setActualSubscriptionLimits] = useState({
    maxConversations: -1,
    maxExperts: -1,
    maxDepartments: -1,
    maxProjectsPerDepartment: -1
  });

  // Calculate usage percentages
  const calculateUsagePercentage = useCallback((current, limit) => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No limit set
    return Math.round((current / limit) * 100);
  }, []);

  // Get usage status (normal, near limit, at limit)
  const getUsageStatus = useCallback((current, limit) => {
    if (limit === -1) return 'unlimited';
    if (current >= limit) return 'at-limit';
    if (current >= limit * 0.8) return 'near-limit';
    return 'normal';
  }, []);

  // Calculate project limit based on actual subscription plan
  const calculateProjectLimit = useCallback(() => {
    // Use actual subscription limits if available, otherwise fall back to context
    const actualLimit = actualSubscriptionLimits.maxProjectsPerDepartment;
    const contextLimit = maxProjectsPerDepartment;
    const effectiveLimit = actualLimit !== -1 ? actualLimit : contextLimit;
    
    if (effectiveLimit === -1) {
      return -1; // Unlimited
    }
    // If maxProjectsPerDepartment is per department, multiply by number of departments
    return effectiveLimit * departments.length;
  }, [actualSubscriptionLimits.maxProjectsPerDepartment, maxProjectsPerDepartment, departments.length]);

  // Check if can add more projects
  const canAddMoreProjects = useCallback(() => {
    if (projectLimit === -1) return true; // Unlimited
    return realTimeProjectsCount < projectLimit;
  }, [realTimeProjectsCount, projectLimit]);

  // Function to fetch actual subscription plan limits from Stripe
  const fetchActualSubscriptionLimits = useCallback(async () => {
    if (!token || !stateBusinessId) {
      console.log('[DPM] Missing token or stateBusinessId for subscription limits fetch');
      return;
    }

    try {
      console.log('[DPM] Fetching actual subscription limits from Stripe for business:', stateBusinessId);
      
      // Check if stripeService is available
      if (!stripeService) {
        console.warn('[DPM] Stripe service not available, using context limits');
        setActualSubscriptionLimits({
          maxConversations: maxConversations,
          maxExperts: maxExperts,
          maxDepartments: maxDepartments,
          maxProjectsPerDepartment: maxProjectsPerDepartment
        });
        return;
      }
      
      const response = await stripeService.getBusinessSubscriptionInfo(stateBusinessId);
      console.log('[DPM] Stripe subscription info received:', response.data);
      
      if (response.data.success && response.data.data.subscriptions?.length > 0) {
        const subscription = response.data.data.subscriptions[0];
        console.log('[DPM] Active subscription found:', subscription);
        
        // Try to get plan ID from subscription
        let planId = null;
        
        // First try to get plan ID from subscription metadata
        if (subscription.metadata?.planId) {
          planId = parseInt(subscription.metadata.planId);
          console.log('[DPM] Found plan ID in subscription metadata:', planId);
        }
        // If not in metadata, try to get from plan object
        else if (subscription.plan?.id) {
          planId = parseInt(subscription.plan.id);
          console.log('[DPM] Found plan ID in subscription plan object:', planId);
        }
        // If still not found, try to map from amount like dashboard does
        else if (subscription.plan?.amount) {
          const amount = subscription.plan.amount.toString();
          const PLAN_AMOUNT_MAPPING = {
            '9800': { name: 'Starter Plan', planId: 1 },
            '20000': { name: 'Growth Plan', planId: 2 },
            '300000': { name: 'Enterprise Plan', planId: 3 },
            '150000': { name: 'Scale Plan', planId: 4 }
          };
          const planDetails = PLAN_AMOUNT_MAPPING[amount];
          if (planDetails) {
            planId = planDetails.planId;
            console.log('[DPM] Mapped plan ID from amount:', amount, '->', planId);
          }
        }
        
        if (planId) {
          console.log('[DPM] Fetching plan details for plan ID:', planId);
          try {
            const { subscriptionPlans } = await import('../services/ApiService');
            const planResponse = await subscriptionPlans.getById(planId);
            const planDetails = planResponse.data;
            console.log('[DPM] Plan details received:', planDetails);
            
            // Extract actual limits from plan details
            const actualLimits = {
              maxConversations: planDetails.maxConversations || -1,
              maxExperts: planDetails.maxExperts || -1,
              maxDepartments: planDetails.maxDepartments || -1,
              maxProjectsPerDepartment: planDetails.maxProjectsPerDepartment || -1
            };
            
            console.log('[DPM] Extracted actual plan limits:', actualLimits);
            setActualSubscriptionLimits(actualLimits);
            return;
          } catch (planError) {
            console.error('[DPM] Error fetching plan details:', planError);
            // Fall back to context limits
          }
        } else {
          console.log('[DPM] Could not determine plan ID from subscription');
        }
      } else {
        console.log('[DPM] No active subscription found, using context limits');
      }
      
      // Fall back to context limits if we couldn't get actual limits
      setActualSubscriptionLimits({
        maxConversations: maxConversations,
        maxExperts: maxExperts,
        maxDepartments: maxDepartments,
        maxProjectsPerDepartment: maxProjectsPerDepartment
      });
    } catch (error) {
      console.error('[DPM] Error fetching actual subscription limits:', error);
      // Fall back to context limits
      setActualSubscriptionLimits({
        maxConversations: maxConversations,
        maxExperts: maxExperts,
        maxDepartments: maxDepartments,
        maxProjectsPerDepartment: maxProjectsPerDepartment
      });
    }
  }, [token, stateBusinessId, maxConversations, maxExperts, maxDepartments, maxProjectsPerDepartment]);

  // Update real-time project count when projects array changes
  useEffect(() => {
    const count = projects.length;
    setRealTimeProjectsCount(count);
    console.log('[DPM] Real-time projects count updated:', count);
  }, [projects]);

  // Update project limit when departments or subscription changes
  useEffect(() => {
    const limit = calculateProjectLimit();
    setProjectLimit(limit);
    console.log('[DPM] Project limit updated:', limit, 'based on actual subscription limits');
  }, [calculateProjectLimit, actualSubscriptionLimits, maxProjectsPerDepartment, departments.length]);

  // Console log subscription limits whenever they change
  useEffect(() => {
    console.log('[DPM] Subscription limits updated:', {
      contextLimits: {
        maxConversations,
        maxExperts,
        maxDepartments,
        maxProjectsPerDepartment
      },
      actualLimits: actualSubscriptionLimits,
      currentProjectLimit: projectLimit,
      currentProjectsCount: realTimeProjectsCount,
      canAddMore: canAddMoreProjects(),
      departmentsCount: departments.length,
      effectiveProjectLimit: actualSubscriptionLimits.maxProjectsPerDepartment !== -1 ? 
        actualSubscriptionLimits.maxProjectsPerDepartment * departments.length : -1
    });
  }, [maxConversations, maxExperts, maxDepartments, maxProjectsPerDepartment, actualSubscriptionLimits, projectLimit, realTimeProjectsCount, canAddMoreProjects, departments.length]);

  // Fetch actual subscription limits when component mounts
  useEffect(() => {
    if (token && stateBusinessId) {
      console.log('[DPM] Fetching actual subscription limits on mount');
      fetchActualSubscriptionLimits();
    }
  }, [token, stateBusinessId, fetchActualSubscriptionLimits]);

  // Simple optimistic UI update function
  const updateUIOptimistically = useCallback((newCount) => {
    console.log('[DPM Page] Optimistic UI update to:', newCount);
    setCurrentProjectsCount(newCount);
  }, []);

  // Simple function to get subscription usage directly from backend
  const getSubscriptionUsageFromBackend = useCallback(async () => {
    console.log('[DPM Page] Getting subscription usage directly from backend');
    try {
      const { subscriptionUsage } = await import('../services/ApiService');
      const response = await subscriptionUsage.getBusinessUsageMetrics(stateBusinessId);
      
      if (response && response.data && response.data.projectsCount !== undefined) {
        setCurrentProjectsCount(response.data.projectsCount);
        console.log('[DPM Page] Updated projects count from backend:', response.data.projectsCount);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[DPM Page] Error getting subscription usage from backend:', error);
      return null;
    }
  }, [stateBusinessId]);

  // Function to fetch comprehensive usage data
  const fetchUsageData = useCallback(async () => {
    console.log('[DPM Page] Fetching comprehensive usage data');
    try {
      const { subscriptionUsage } = await import('../services/ApiService');
      const response = await subscriptionUsage.getBusinessUsageMetrics(stateBusinessId);
      
      if (response && response.data) {
        const usageData = response.data;
        setUsageCounters({
          conversationsCount: usageData.conversationsCount || 0,
          expertsCount: usageData.expertsCount || 0,
          departmentsCount: usageData.departmentsCount || 0,
          projectsCount: usageData.projectsCount || 0
        });
        console.log('[DPM Page] Updated usage counters:', usageData);
        return usageData;
      }
      return null;
    } catch (error) {
      console.error('[DPM Page] Error fetching usage data:', error);
      return null;
    }
  }, [stateBusinessId]);

  // Function to immediately update subscription context with backend data
  const updateSubscriptionContextImmediately = useCallback(async (backendData) => {
    console.log('[DPM Page] Updating subscription context immediately with backend data:', backendData);
    try {
      // Update the subscription context with the fresh data immediately
      if (backendData && backendData.projectsCount !== undefined) {
        // Update the projects usage in the context
        updateProjectsUsageImmediately(backendData.projectsCount);
        console.log('[DPM Page] Updated subscription context immediately with projects count:', backendData.projectsCount);
      }
    } catch (error) {
      console.error('[DPM Page] Error updating subscription context immediately:', error);
    }
  }, [updateProjectsUsageImmediately]);

  // Wrap isBusinessOwnerFunction with useCallback
  const isBusinessOwnerFunction = useCallback(() => {
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
  }, [businessId, stateBusinessId]);

  // Wrap fetchSingleDepartment with useCallback
  const fetchSingleDepartment = useCallback(async (deptId) => {
    try {
      console.log("Fetching single department with ID:", deptId);
      const response = await departmentsApi.getById(deptId);
      if (response.data) {
        setDepartments([response.data]);
      } else {
        setDepartments([]);
        setError(`Department with ID ${deptId} not found.`);
      }
    } catch (error) {
      console.error('Error fetching single department:', error);
      setError('Failed to fetch department details. Please try again later.');
      setDepartments([]);
    }
  }, [setDepartments, setError]);

  const fetchDepartments = useCallback(async () => {
    try {
      console.log("Fetching departments for business ID:", businessId);
      if (!businessId) {
        setDepartments([]);
        return;
      }
      const response = await departmentsApi.getByBusinessId(businessId);
      setDepartments(response.data || []);
      
      // Get fresh subscription usage from backend
      await getSubscriptionUsageFromBackend();
      
      setOperationError(null);

    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments. Please try again later.');
      setDepartments([]);
      setOperationError('Failed to load departments.');
    }
  }, [businessId, setDepartments, setError, getSubscriptionUsageFromBackend]);

  // Wrap fetchProjects with useCallback
  const fetchProjects = useCallback(async () => {
    try {
      console.log("Fetching projects for business ID:", businessId);
      if (!businessId) {
        setProjects([]);
        return;
      }
      const response = await projectsApi.getByBusinessId(businessId);
      setProjects(response.data || []);
      
      // Get fresh subscription usage from backend
      await getSubscriptionUsageFromBackend();
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects. Please try again later.');
      setProjects([]);
    }
  }, [businessId, setProjects, setError, getSubscriptionUsageFromBackend]);

  // Add function to fetch all project permissions
  const fetchAllProjectPermissions = useCallback(async () => {
    try {
      console.log('[DPM Page] 📥 fetchAllProjectPermissions called', {
        businessId, 
        hasToken: !!token,
        timestamp: new Date().toISOString()
      });
      
      if (!businessId || !token) {
        console.log('[DPM Page] ❌ Missing businessId or token, setting empty permissions');
        setProjectPermissions([]);
        return;
      }
      
      console.log('[DPM Page] 🔑 Setting auth token for permissions fetch');
      setAuthToken(token);
      
      // Get all projects first
      console.log('[DPM Page] 🌐 Fetching all projects for business:', businessId);
      const projectsResponse = await projectsApi.getByBusinessId(businessId);
      const allProjects = projectsResponse.data || [];
      console.log('[DPM Page] 📊 Projects fetched:', { 
        projectCount: allProjects.length,
        projects: allProjects.map(p => ({ id: p.projectId, name: p.name }))
      });
      
      if (allProjects.length === 0) {
        console.log('[DPM Page] ❌ No projects found, setting empty permissions');
        setProjectPermissions([]);
        return;
      }
      
      // Fetch permissions for each project
      console.log('[DPM Page] 🔄 Fetching permissions for each project...');
      const permissionsPromises = allProjects.map(async (project) => {
        try {
          console.log(`[DPM Page] 📡 Fetching permissions for project ${project.projectId} (${project.name})`);
          const permissionsResponse = await permissionsApi.getByProjectId(project.projectId);
          const permissions = permissionsResponse.data || [];
          console.log(`[DPM Page] ✅ Permissions fetched for project ${project.projectId}:`, {
            projectId: project.projectId,
            projectName: project.name,
            permissionCount: permissions.length,
            permissions: permissions.map(p => ({
              permissionId: p.permissionId,
              userId: p.userId,
              canAnswer: p.canAnswer
            }))
          });
          return {
            projectId: project.projectId,
            projectName: project.name,
            permissions: permissions
          };
        } catch (error) {
          console.error(`[DPM Page] ❌ Error fetching permissions for project ${project.projectId}:`, error);
          return {
            projectId: project.projectId,
            projectName: project.name,
            permissions: []
          };
        }
      });
      
      console.log('[DPM Page] ⏳ Waiting for all permission promises to complete...');
      const allPermissions = await Promise.all(permissionsPromises);
      console.log('[DPM Page] 📊 All permissions fetched successfully:', {
        totalProjects: allPermissions.length,
        allPermissions,
        timestamp: new Date().toISOString()
      });
      
      setProjectPermissions(allPermissions);
      console.log('[DPM Page] 💾 Project permissions state updated');
      
    } catch (error) {
      console.error('[DPM Page] ❌ Error fetching project permissions:', {
        error,
        errorMessage: error.message,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        timestamp: new Date().toISOString()
      });
      setProjectPermissions([]);
    }
  }, [businessId, token]);

  useEffect(() => {
    setActiveSidebarType('widget');
    console.log("[DPM Page] Mounted or params changed. Fetching initial data.", { businessId, departmentId });
    if (token) {
      setAuthToken(token);
      isBusinessOwnerFunction();
      if (departmentId) {
        fetchSingleDepartment(departmentId);
      } else {
        fetchDepartments();
      }
      fetchProjects(); // Fetch all projects for the business initially
      fetchAllProjectPermissions(); // Also fetch permissions for all projects
    } else {
      setError("Authentication token not found. Please log in.");
      console.error("[DPM Page] No auth token found on mount/param change.");
    }
  }, [
    token, 
    businessId, 
    departmentId, 
    fetchDepartments, 
    fetchProjects, 
    fetchAllProjectPermissions, // Add to dependencies
    fetchSingleDepartment, 
    isBusinessOwnerFunction, 
    setActiveSidebarType,
    setError
  ]);

  useEffect(() => {
    isBusinessOwnerFunction();
  }, [isBusinessOwnerFunction, stateBusinessId, businessId]);

  useEffect(() => {
    console.log("DepartmentProjectManagementPage - Current state:");
    console.log("token:", token);
    console.log("stateBusinessId:", stateBusinessId);
    console.log("businessId from params:", businessId);
    console.log("isBusinessOwner:", isBusinessOwner);
  }, [token, stateBusinessId, businessId, isBusinessOwner]);

  // Get fresh subscription usage when component mounts or business ID changes
  useEffect(() => {
    if (token && stateBusinessId) {
      console.log("[DPM Page] Component mounted or business ID changed, getting subscription usage from backend");
      getSubscriptionUsageFromBackend();
    }
  }, [token, stateBusinessId, getSubscriptionUsageFromBackend]);

  // Refresh project usage when component mounts
  useEffect(() => {
    if (token && stateBusinessId) {
      console.log("[DPM Page] Refreshing project usage metrics");
      refreshProjectsUsage();
    }
  }, [token, stateBusinessId, refreshProjectsUsage]);

  // Initialize current projects count when component mounts
  useEffect(() => {
    if (token && stateBusinessId) {
      console.log("[DPM Page] Initializing current projects count from backend");
      getSubscriptionUsageFromBackend();
    }
  }, [token, stateBusinessId, getSubscriptionUsageFromBackend]);

  // Get fresh subscription usage when departments change (affects project limits)
  useEffect(() => {
    if (token && stateBusinessId && departments.length > 0) {
      console.log("[DPM Page] Departments array changed, getting fresh subscription usage from backend");
      getSubscriptionUsageFromBackend();
    }
  }, [departments.length, token, stateBusinessId, getSubscriptionUsageFromBackend]);

  // Fetch comprehensive usage data when component mounts
  useEffect(() => {
    if (token && stateBusinessId) {
      console.log("[DPM Page] Fetching comprehensive usage data on mount");
      fetchUsageData();
    }
  }, [token, stateBusinessId, fetchUsageData]);

  // Update usage data when departments or projects change
  useEffect(() => {
    if (token && stateBusinessId) {
      console.log("[DPM Page] Departments or projects changed, updating usage data");
      fetchUsageData();
    }
  }, [departments.length, projects.length, token, stateBusinessId, fetchUsageData]);

  const addProject = useCallback(async (imageFile = null) => {
    console.log("[DPM Page] addProject called.", { name: newProjectName, description: newProjectDescription, departmentId: selectedDepartmentId, hasImageFile: !!imageFile });
    
    // Check real-time project limits before creating project
    if (!canAddMoreProjects()) {
      const limitText = projectLimit === -1 ? 'unlimited' : projectLimit;
      setOperationError(`Cannot create project: Project limit reached (${realTimeProjectsCount}/${limitText})`);
      console.warn("[DPM Page] Add project validation failed: Project limit exceeded", {
        current: realTimeProjectsCount,
        limit: projectLimit,
        canAdd: canAddMoreProjects()
      });
      return;
    }
    
    if (!newProjectName.trim()) {
      setOperationError("Project name cannot be empty.");
      console.warn("[DPM Page] Add project validation failed: Name empty.");
      return;
    }
    
    try {
      const projectData = {
        name: newProjectName,
        description: newProjectDescription,
        departmentId: selectedDepartmentId,
        businessId: businessId,
        image: newProjectImage, // URL if provided
        imageUrl: newProjectImage, // For compatibility
        averageResponseTime: newProjectAverageResponseTime,
      };
      
      // Use the new API method that handles both file upload and regular creation
      await projectsApi.create(projectData, imageFile);
      setOperationSuccess(`Project "${newProjectName}" added successfully.`);
      console.log(`[DPM Page] Project "${newProjectName}" added.`);
      
      // Optimistic UI update for both counts
      updateUIOptimistically(currentProjectsCount + 1);
      setRealTimeProjectsCount(prev => prev + 1);
      
      // Get fresh data from backend
      await getSubscriptionUsageFromBackend();
      
      fetchProjects();
      fetchAllProjectPermissions(); // Also refresh permissions when new project is created
      setLegacyModalVisible(false);
    } catch (error) {
      console.error('[DPM Page] Error adding project:', error);
      setOperationError(error.response?.data?.message || 'Failed to add project.');
    }
  }, [newProjectName, newProjectDescription, newProjectImage, newProjectAverageResponseTime, selectedDepartmentId, businessId, fetchProjects, setOperationSuccess, setOperationError, setLegacyModalVisible, getSubscriptionUsageFromBackend, updateUIOptimistically, canAddMoreProjects, projectLimit, realTimeProjectsCount]);

  const addDepartment = useCallback(async () => {
    console.log("[DPM Page] addDepartment called.", { name: newDepartmentName, description: newDepartmentDescription });
    
    if (!newDepartmentName.trim()) {
      setOperationError("Department name cannot be empty.");
      console.warn("[DPM Page] Add department validation failed: Name empty.");
      return;
    }
    
    // Prevent creating a department named "default"
    if (newDepartmentName.toLowerCase().trim() === "default") {
      setOperationError("Cannot create a department named 'default'. This name is reserved.");
      console.warn("[DPM Page] Add department validation failed: Cannot use 'default' name.");
      return;
    }
    
    // Check if department name already exists
    const departmentExists = departments.some(dept => 
      dept.departmentName?.toLowerCase().trim() === newDepartmentName.toLowerCase().trim()
    );
    
    if (departmentExists) {
      setOperationError("A department with this name already exists.");
      console.warn("[DPM Page] Add department validation failed: Name already exists.");
      return;
    }
    
    try {
      await departmentsApi.create({
        departmentName: newDepartmentName,
        description: newDepartmentDescription,
        businessId: businessId,
      });
      setOperationSuccess(`Department "${newDepartmentName}" added successfully.`);
      console.log(`[DPM Page] Department "${newDepartmentName}" added.`);
      
      // Immediately get fresh subscription usage from backend after creating department
      console.log('[DPM Page] Getting fresh subscription usage from backend immediately after department creation');
      await getSubscriptionUsageFromBackend();
      
      // Refresh departments and related usage metrics after successful creation
      await Promise.all([
        fetchDepartments(),
        refreshDepartmentsUsage(),
        refreshProjectsUsage() // Projects limit depends on departments count
      ]);
      setLegacyModalVisible(false);
    } catch (error) {
      console.error('[DPM Page] Error adding department:', error);
      setOperationError(error.response?.data?.message || 'Failed to add department.');
    }
  }, [newDepartmentName, newDepartmentDescription, businessId, departments, fetchDepartments, setOperationSuccess, setOperationError, setLegacyModalVisible, refreshDepartmentsUsage, refreshProjectsUsage]);

  const updateProject = useCallback(async (imageFile = null) => {
    console.log("[DPM Page] updateProject called for projectId:", selectedProjectId, "hasImageFile:", !!imageFile);
    
    if (!selectedProjectId) {
      setOperationError("No project selected for update.");
      return;
    }
    
    try {
      const updatedProject = {
        name: newProjectName,
        description: newProjectDescription,
        image: newProjectImage,
        imageUrl: newProjectImage, // Include both for compatibility
        averageResponseTime: newProjectAverageResponseTime,
        departmentId: selectedDepartmentId
      };
      
      console.log("[DPM Page] Updating project with data:", updatedProject);
      
      // Use the new API method that handles both file upload and regular update
      await projectsApi.update(selectedProjectId, updatedProject, imageFile);
      setOperationSuccess(`Project "${newProjectName}" updated successfully.`);
      console.log(`[DPM Page] Project "${newProjectName}" updated.`);
      
      // Close modal and refresh data
      setLegacyModalVisible(false);
      fetchProjects();
    } catch (error) {
      console.error('[DPM Page] Error updating project:', error);
      setOperationError(error.response?.data?.message || 'Failed to update project.');
    }
  }, [selectedProjectId, newProjectName, newProjectDescription, newProjectImage, newProjectAverageResponseTime, selectedDepartmentId, fetchProjects]);

  const updateDepartment = useCallback(async () => {
    console.log("[DPM Page] updateDepartment called for departmentId:", selectedDepartmentId);
    if (!newDepartmentName.trim()) {
      setOperationError("Department name cannot be empty.");
      console.warn("[DPM Page] Update department validation failed: Name empty.");
      return;
    }
    try {
      await departmentsApi.update(selectedDepartmentId, {
        departmentName: newDepartmentName,
        description: newDepartmentDescription,
      });
      setOperationSuccess(`Department "${newDepartmentName}" updated successfully.`);
      console.log(`[DPM Page] Department "${newDepartmentName}" updated.`);
      fetchDepartments();
      setLegacyModalVisible(false);
    } catch (error) {
      console.error('[DPM Page] Error updating department:', error);
      setOperationError(error.response?.data?.message || 'Failed to update department.');
    }
  }, [selectedDepartmentId, newDepartmentName, newDepartmentDescription, fetchDepartments, setOperationSuccess, setOperationError, setLegacyModalVisible]);

  const deleteProject = useCallback(async (projectId) => {
    console.log("[DPM Page] deleteProject called for projectId:", projectId);
    
    // Find the project to check if it's the default one
    const project = projects.find(p => p.projectId === projectId);
    if (project && project.name?.toLowerCase().trim() === "default topic") {
      setOperationError("Cannot delete the default project. This project is required for system operation.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectsApi.delete(projectId);
        setOperationSuccess('Project deleted successfully.');
        console.log(`[DPM Page] Project ${projectId} deleted.`);
        
        // Optimistic UI update for both counts
        updateUIOptimistically(Math.max(0, currentProjectsCount - 1));
        setRealTimeProjectsCount(prev => Math.max(0, prev - 1));
        
        // Get fresh data from backend
        await getSubscriptionUsageFromBackend();
        
        // Refresh projects after successful deletion
        await fetchProjects();
        await fetchAllProjectPermissions(); // Also refresh permissions when project is deleted
      } catch (error) {
        console.error('[DPM Page] Error deleting project:', error);
        setOperationError(error.response?.data?.message || 'Failed to delete project.');
      }
    } else {
      console.log("[DPM Page] Project deletion cancelled by user.");
    }
  }, [projects, fetchProjects, setOperationSuccess, setOperationError, getSubscriptionUsageFromBackend, updateUIOptimistically, currentProjectsCount]);

  const deleteDepartment = useCallback(async (departmentId) => {
    console.log("[DPM Page] deleteDepartment called for departmentId:", departmentId);
    
    // Find the department to check if it's the default one - EXACT match
    const department = departments.find(d => d.id === departmentId);
    if (department && department.departmentName?.toLowerCase().trim() === "default") {
      setOperationError("Cannot delete the default department. This department is required for system operation.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this department and all its projects? This action cannot be undone.')) {
      try {
        await departmentsApi.delete(departmentId);
        setOperationSuccess('Department deleted successfully.');
        console.log(`[DPM Page] Department ${departmentId} deleted.`);
        
        // Immediately get fresh subscription usage from backend after deleting department
        console.log('[DPM Page] Getting fresh subscription usage from backend immediately after department deletion');
        await getSubscriptionUsageFromBackend();
        
        // Refresh departments, projects, and related usage metrics after successful deletion
        await Promise.all([
          fetchDepartments(),
          fetchProjects(),
          refreshDepartmentsUsage(),
          refreshProjectsUsage() // Projects limit depends on departments count
        ]);
      } catch (error) {
        console.error('[DPM Page] Error deleting department:', error);
        setOperationError(error.response?.data?.message || 'Failed to delete department.');
      }
    } else {
      console.log("[DPM Page] Department deletion cancelled by user.");
    }
  }, [departments, fetchDepartments, fetchProjects, setOperationSuccess, setOperationError, refreshDepartmentsUsage, refreshProjectsUsage]);

  // Handlers for opening modals
  const openUpdateProjectModal = useCallback((departmentId, projectId) => {
    console.log("[DPM Page] openUpdateProjectModal called for projectId:", projectId, "in departmentId:", departmentId);
    
    // Find the project to check if it's the default one
    const project = projects.find(p => p.projectId === projectId);
    if (project && project.name?.toLowerCase().trim() === "default topic") {
      setOperationError("Cannot update the default project. This project is system-managed.");
      return;
    }
    
    if (project) {
      console.log("[DPM Page] Found project to update:", project);
      
      setSelectedProjectId(projectId);
      setNewProjectName(project.name || '');
      setNewProjectDescription(project.description || '');
      setNewProjectImage(project.imageUrl || project.image || '');
      setNewProjectAverageResponseTime(project.averageResponseTime || '');
      setLegacyModalType('updateProject');
      setLegacyModalVisible(true);
      setOperationError(null);
      setOperationSuccess(null);
    } else {
      console.error("[DPM Page] Project not found for update:", projectId);
      setOperationError("Project not found. Please try again.");
    }
  }, [projects, setOperationError]);

  const openUpdateDepartmentModal = useCallback((departmentId) => {
    console.log("[DPM Page] openUpdateDepartmentModal called for departmentId:", departmentId);
    
    // Find the department to check if it's the default one - EXACT match
    const department = departments.find(d => d.id === departmentId);
    if (department && department.departmentName?.toLowerCase().trim() === "default") {
      setOperationError("Cannot update the default department. This department is system-managed.");
      return;
    }
    
    if (department) {
      setSelectedDepartmentId(departmentId);
      setNewDepartmentName(department.departmentName || '');
      setNewDepartmentDescription(department.description || '');
      setLegacyModalType('updateDepartment');
      setLegacyModalVisible(true);
      setOperationError(null);
      setOperationSuccess(null);
    } else {
      console.error("[DPM Page] Department not found for update:", departmentId);
      setOperationError("Department not found. Please try again.");
    }
  }, [departments, setOperationError]);

  const openAddProjectModal = useCallback(async (departmentId) => {
    console.log("[DPM Page] openAddProjectModal called for departmentId:", departmentId);
    
    // Check real-time project limits before opening modal
    if (!canAddMoreProjects()) {
      const limitText = projectLimit === -1 ? 'unlimited' : projectLimit;
      setOperationError(`Cannot create project: Project limit reached (${realTimeProjectsCount}/${limitText})`);
      console.warn("[DPM Page] Add project modal blocked: Project limit exceeded", {
        current: realTimeProjectsCount,
        limit: projectLimit,
        canAdd: canAddMoreProjects()
      });
      return;
    }
    
    // Find the department to check if it's the default one - EXACT match
    const department = departments.find(d => d.id === departmentId);
    if (department && department.departmentName?.toLowerCase().trim() === "default") {
      setOperationError("Cannot add projects to the default department. The default department can only contain the default project.");
      return;
    }
    
    setSelectedDepartmentId(departmentId);
    clearModalFields();
    setLegacyModalType('project');
    setLegacyModalVisible(true);
  }, [departments, setSelectedDepartmentId, setLegacyModalType, setLegacyModalVisible, setOperationError, canAddMoreProjects, projectLimit, realTimeProjectsCount]);

  const openAddDepartmentModal = useCallback(() => {
    console.log("[DPM Page] openAddDepartmentModal called.");
    setLegacyModalType('department');
    setNewDepartmentName('');
    setNewDepartmentDescription('');
    setLegacyModalVisible(true);
    setOperationError(null);
  }, [setNewDepartmentName, setNewDepartmentDescription, setLegacyModalVisible, setOperationError]);

  const handleModalSubmit = useCallback((imageFile = null) => {
    console.log("[DPM Page] handleModalSubmit called with modalType:", legacyModalType, "hasImageFile:", !!imageFile);
    
    switch (legacyModalType) {
      case 'project':
        addProject(imageFile);
        break;
      case 'department':
        addDepartment();
        break;
      case 'updateProject':
        updateProject(imageFile);
        break;
      case 'updateDepartment':
        updateDepartment();
        break;
      default:
        console.warn("[DPM Page] Unknown modal type:", legacyModalType);
    }
  }, [legacyModalType, addProject, addDepartment, updateProject, updateDepartment]);

  // Improved openModalHandler with useCallback and better validation
  const openModalHandler = useCallback((modalType, projectDetails) => {
    console.log(`[DPM] openModalHandler called. Type: ${modalType}, ProjectDetails:`, projectDetails);
    
    // Validate required data
    if (!projectDetails || !projectDetails.projectId) {
      console.error("[DPM] Missing project details or projectId:", projectDetails);
      setOperationError("Cannot open modal: Missing project information.");
      return;
    }

    // Validate department ID for manage agents modal
    if (modalType === 'manageAgents' && !projectDetails.departmentId) {
      console.error("[DPM] Missing departmentId for manageAgents modal:", projectDetails);
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

    console.log(`[DPM] Setting activeModalInfo:`, { type: modalType, data: modalData });
    setModalLoading(true);
    setActiveModalInfo({ type: modalType, data: modalData });
    
    // Remove loading after a short delay (or when modal content loads)
    setTimeout(() => setModalLoading(false), 100);
  }, [setOperationError]);

  const closeActiveModal = useCallback(() => {
    console.log('[DPM Page] closeActiveModal called.');
    // Add a small delay to ensure any pending operations complete
    setTimeout(() => {
      setActiveModalInfo(null);
      console.log('[DPM Page] Modal actually closed after delay');
    }, 300);
  }, []);

  const handleAgentsUpdated = useCallback(async () => {
    console.log('[DPM Page] 🚨 handleAgentsUpdated called - Agent permissions updated!', {
      timestamp: new Date().toISOString(),
      hasToken: !!token,
      currentPermissionRefreshTrigger: permissionRefreshTrigger
    });
    
    try {
      // Refresh projects and departments data to reflect any permission changes
      console.log('[DPM Page] 🔄 Starting data refresh...');
      
      // Ensure auth token is set before making API calls
      if (token) {
        console.log('[DPM Page] 🔑 Setting auth token for refresh');
        setAuthToken(token);
      } else {
        console.warn('[DPM Page] ⚠️ No token available for refresh');
      }
      
      console.log('[DPM Page] 📊 Calling refresh functions...');
      const refreshPromises = [
        fetchProjects(),
        fetchDepartments(),
        fetchAllProjectPermissions(), // Add permissions refresh
        fetchUsageData() // Refresh usage data in case expert counts changed
      ];
      
      console.log('[DPM Page] ⏳ Waiting for all refresh promises to complete...');
      await Promise.all(refreshPromises);
      console.log('[DPM Page] ✅ All refresh promises completed');
      
      console.log('[DPM Page] 📈 Data refresh completed successfully');
      
      // Trigger permission refresh in DepartmentProjectsGrid
      console.log('[DPM Page] 🎯 About to trigger permission refresh', {
        currentTrigger: permissionRefreshTrigger,
        willBecome: permissionRefreshTrigger + 1
      });
      
      setPermissionRefreshTrigger(prev => {
        const newTrigger = prev + 1;
        console.log('[DPM Page] 🚀 Permission refresh trigger updated!', {
          from: prev, 
          to: newTrigger,
          timestamp: new Date().toISOString()
        });
        return newTrigger;
      });
      
      // Force a re-render by updating refresh key
      setRefreshKey(prev => {
        const newKey = prev + 1;
        console.log('[DPM Page] 🔄 Updated refresh key from', prev, 'to', newKey);
        return newKey;
      });
      
      // Clear any existing errors first
      setOperationError(null);
      
      // Set success message after a small delay to ensure it's visible
      setTimeout(() => {
        console.log('[DPM Page] 📝 Setting success message');
        setOperationSuccess('Agent permissions updated successfully!');
        console.log('[DPM Page] ✅ Success message set after refresh');
      }, 200);
      
    } catch (error) {
      console.error('[DPM Page] ❌ Error refreshing data after agent updates:', {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      });
      setOperationError('Permissions updated but failed to refresh display. Please refresh the page.');
    }
  }, [token, fetchProjects, fetchDepartments, fetchAllProjectPermissions, fetchUsageData, setOperationSuccess, setOperationError, permissionRefreshTrigger]);

  // Add logging for permission refresh trigger state changes
  useEffect(() => {
    console.log('[DPM Page] 🎯 Permission refresh trigger state changed:', {
      permissionRefreshTrigger,
      timestamp: new Date().toISOString()
    });
  }, [permissionRefreshTrigger]);

  const handleUploadSuccess = useCallback((message) => {
    console.log('[DPM Page] handleUploadSuccess called:', message);
    setOperationSuccess(message || `Data uploaded successfully for ${activeModalInfo?.data?.projectName}`);
    setIsUploadSuccessful(true);
    closeActiveModal();
    fetchProjects();
  }, [fetchProjects, closeActiveModal, activeModalInfo, setOperationSuccess, setIsUploadSuccessful]); // Added dependencies

  // VITAL DIAGNOSTIC LOGS:
  console.log('[DPM] PRE-RENDER CHECK: typeof openModalHandler IS:', typeof openModalHandler);
  // You can also log the function itself to see its definition if needed:
  // console.log('[DPM] PRE-RENDER CHECK: openModalHandler definition:', openModalHandler);

  // Remove the clearModalState and handleModalClose complexity - just use simple close
  const handleModalClose = useCallback(() => {
    setLegacyModalVisible(false);
    setLegacyModalType(null);
    setOperationError(null);
    setOperationSuccess(null);
  }, []);

  // Function to clear modal fields
  const clearModalFields = useCallback(() => {
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectImage('');
    setNewProjectAverageResponseTime('');
    setNewDepartmentName('');
    setNewDepartmentDescription('');
    setSelectedDepartmentId(null);
    setSelectedProjectId(null);
  }, []);

  // Update the checkAndCreateDefaultDepartment function to only create department
  const checkAndCreateDefaultDepartment = useCallback(async () => {
    try {
      console.log("[DPM Page] Checking for default department in business:", businessId);
      
      // Check if a default department already exists - EXACT match only
      const hasDefaultDepartment = departments.some(dept => 
        dept.departmentName?.toLowerCase().trim() === "default"
      );
      
      if (hasDefaultDepartment) {
        console.log("[DPM Page] Default department already exists");
        return;
      }
      
      // Only try to create default department if user is business owner AND admin
      if (role !== "ROLE_ADMIN" || isBusinessOwner !== "yes") {
        console.log("[DPM Page] User doesn't have sufficient permissions for default department creation");
        return;
      }
      
      console.log("[DPM Page] No default department found, creating one...");
      
      // Create default department only
      const defaultDepartmentData = {
        departmentName: "default",
        description: "Default expertise area for general inquiries and topics",
        businessId: parseInt(businessId)
      };
      
      const response = await departmentsApi.create(defaultDepartmentData);
      console.log("[DPM Page] Default department created successfully:", response.data);
      
      // Refresh departments and related usage metrics after successful creation
      await Promise.all([
        fetchDepartments(),
        refreshProjectsUsage(), // Projects limit depends on departments count
        refreshDepartmentsUsage()
      ]);
      
      setOperationSuccess("Default expertise area created successfully!");
      
    } catch (error) {
      console.error('[DPM Page] Error checking/creating default department:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        console.log("[DPM Page] Default department already exists (409 conflict)");
      } else if (error.response?.status === 403) {
        console.log("[DPM Page] User doesn't have permission to create default department");
      } else {
        console.log("[DPM Page] Failed to create default department:", error.message);
      }
    }
  }, [businessId, departments, role, isBusinessOwner, fetchDepartments, setOperationSuccess, refreshProjectsUsage, refreshDepartmentsUsage]);

  // Add useEffect to run the check after departments are loaded
  useEffect(() => {
    // Only run this check if:
    // 1. We have a businessId
    // 2. We have loaded departments (even if empty)
    // 3. User is business owner AND admin
    // 4. We don't already have a default department (EXACT match)
    if (
      businessId && 
      Array.isArray(departments) && 
      role === "ROLE_ADMIN" && 
      isBusinessOwner === "yes" &&
      !departments.some(dept => dept.departmentName?.toLowerCase().trim() === "default")
    ) {
      console.log("[DPM Page] Running default department check...");
      checkAndCreateDefaultDepartment();
    }
  }, [businessId, departments, role, isBusinessOwner, checkAndCreateDefaultDepartment]);

  // Update the checkAndCreateDefaultProject function to prevent duplicates
  const checkAndCreateDefaultProject = useCallback(async () => {
    // Prevent multiple simultaneous creation attempts
    if (isCreatingDefaultProject) {
      console.log("[DPM Page] Default project creation already in progress, skipping");
      return;
    }

    try {
      setIsCreatingDefaultProject(true);
      console.log("[DPM Page] Checking for default project in default department");
      
      // Find the default department
      const defaultDepartment = departments.find(dept => 
        dept.departmentName?.toLowerCase().trim() === "default"
      );
      
      if (!defaultDepartment) {
        console.log("[DPM Page] No default department found, skipping default project creation");
        return;
      }
      
      // Use the correct field name from DepartmentOutputDTO
      const departmentId = defaultDepartment.departmentId || defaultDepartment.id;
      
      // Triple-check by fetching latest projects to avoid race conditions
      console.log("[DPM Page] Fetching latest projects to check for duplicates");
      const latestProjectsResponse = await projectsApi.getAll();
      const latestProjects = latestProjectsResponse.data || [];
      
      // Check ONLY for default projects in the correct default department
      const correctDefaultProjects = latestProjects.filter(project => 
        project.departmentId === departmentId && 
        project.name?.toLowerCase().trim() === "default topic"
      );
      
      if (correctDefaultProjects.length > 0) {
        console.log("[DPM Page] Default project already exists in default department (found in latest check)");
        return;
      }
      
      // Also check if there are any default projects in wrong departments (cleanup might have missed them)
      const wrongPlaceDefaultProjects = latestProjects.filter(project => 
        project.departmentId !== departmentId && 
        project.name?.toLowerCase().trim() === "default topic"
      );
      
      if (wrongPlaceDefaultProjects.length > 0) {
        console.log("[DPM Page] Found default projects in wrong departments, cleaning them up first");
        for (const project of wrongPlaceDefaultProjects) {
          try {
            await projectsApi.delete(project.projectId);
            console.log("[DPM Page] Deleted misplaced default project:", project.projectId);
          } catch (deleteError) {
            console.error("[DPM Page] Error deleting misplaced default project:", deleteError);
          }
        }
      }
      
      // Only try to create default project if user is business owner AND admin
      if (role !== "ROLE_ADMIN" || isBusinessOwner !== "yes") {
        console.log("[DPM Page] User doesn't have sufficient permissions for default project creation");
        return;
      }
      
      console.log("[DPM Page] No default project found in default department, creating one...");
      
      // Create default project using correct ProjectInputDTO structure
      const defaultProjectData = {
        name: "default topic",
        description: "Default project for general inquiries and topics",
        departmentId: departmentId,
        averageResponseTime: 24.0
      };
      
      console.log("[DPM Page] Creating default project with data:", defaultProjectData);
      
      const response = await projectsApi.create(defaultProjectData);
      console.log("[DPM Page] Default project created successfully:", response.data);
      
      // Refresh projects and usage metrics after successful creation
      await Promise.all([
        fetchProjects(),
        refreshProjectsUsage()
      ]);
      
      setOperationSuccess("Default topic created successfully!");
      
    } catch (error) {
      console.error('[DPM Page] Error checking/creating default project:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        console.log("[DPM Page] Default project already exists (409 conflict) - this is expected");
      } else if (error.response?.status === 403) {
        console.log("[DPM Page] User doesn't have permission to create default project");
      } else if (error.response?.status === 500) {
        console.log("[DPM Page] Server error during default project creation (possibly embedding generation issue)");
        // Try to refresh projects anyway
        try {
          await fetchProjects();
          const refreshedProjects = await projectsApi.getByBusinessId(businessId);
          const hasDefaultProjectAfterError = refreshedProjects.data?.some(project => 
            project.departmentId === departmentId && 
            project.name?.toLowerCase().trim() === "default topic"
          );
          
          if (hasDefaultProjectAfterError) {
            console.log("[DPM Page] Default project was created successfully despite server error");
            setOperationSuccess("Default topic created successfully (with some optional features unavailable)!");
          } else {
            console.log("[DPM Page] Default project creation failed due to server error");
            setOperationError("Failed to create default topic due to server configuration. Please contact support.");
          }
        } catch (refreshError) {
          console.error("[DPM Page] Error refreshing projects after 500 error:", refreshError);
        }
      } else {
        console.log("[DPM Page] Failed to create default project:", error.message);
        setOperationError("Failed to create default topic. Please try again later.");
      }
    } finally {
      setIsCreatingDefaultProject(false);
    }
  }, [departments, projects, businessId, role, isBusinessOwner, fetchProjects, setOperationSuccess, setOperationError, isCreatingDefaultProject, refreshProjectsUsage]);

  // Update useEffect to handle correct field names
  useEffect(() => {
    // Only run this check if:
    // 1. We have a businessId
    // 2. We have loaded departments and projects
    // 3. User is business owner AND admin
    // 4. We have a default department
    // 5. We don't already have a default project in the default department
    if (
      businessId && 
      Array.isArray(departments) && 
      Array.isArray(projects) &&
      role === "ROLE_ADMIN" && 
      isBusinessOwner === "yes"
    ) {
      const defaultDepartment = departments.find(dept => 
        dept.departmentName?.toLowerCase().trim() === "default"
      );
      
      if (defaultDepartment) {
        // Use correct field name from DepartmentOutputDTO
        const departmentId = defaultDepartment.departmentId || defaultDepartment.id;
        
        const hasDefaultProject = projects.some(project => 
          project.departmentId === departmentId && 
          project.name?.toLowerCase().trim() === "default topic"
        );
        
        if (!hasDefaultProject) {
          console.log("[DPM Page] Running default project check...");
          checkAndCreateDefaultProject();
        }
      }
    }
  }, [businessId, departments, projects, role, isBusinessOwner, checkAndCreateDefaultProject]);

  // Add this function to clean up duplicate default projects
  const cleanupDuplicateDefaultProjects = useCallback(async () => {
    try {
      console.log("[DPM Page] Checking for duplicate/misplaced default projects");
      
      // Get all projects in the business
      const allProjectsResponse = await projectsApi.getAll();
      const allProjects = allProjectsResponse.data || [];
      
      // Find all projects named "default topic" (case-insensitive)
      const defaultProjects = allProjects.filter(project => 
        project.name?.toLowerCase().trim() === "default topic"
      );
      
      if (defaultProjects.length === 0) {
        console.log("[DPM Page] No default projects found");
        return;
      }
      
      // Find the correct default department
      const defaultDepartment = departments.find(dept => 
        dept.departmentName?.toLowerCase().trim() === "default"
      );
      
      if (!defaultDepartment) {
        console.log("[DPM Page] No default department found, cannot cleanup default projects");
        // Delete all default projects if there's no default department
        for (const project of defaultProjects) {
          try {
            await projectsApi.delete(project.projectId);
            console.log("[DPM Page] Deleted orphaned default project:", project.projectId);
          } catch (deleteError) {
            console.error("[DPM Page] Error deleting orphaned default project:", deleteError);
          }
        }
        return;
      }
      
      const correctDepartmentId = defaultDepartment.departmentId || defaultDepartment.id;
      
      // Separate default projects into correct and misplaced
      const correctlyPlacedDefaults = defaultProjects.filter(p => p.departmentId === correctDepartmentId);
      const misplacedDefaults = defaultProjects.filter(p => p.departmentId !== correctDepartmentId);
      
      // Delete misplaced default projects (they shouldn't exist outside default department)
      for (const project of misplacedDefaults) {
        try {
          await projectsApi.delete(project.projectId);
          console.log("[DPM Page] Deleted misplaced default project:", project.projectId);
        } catch (deleteError) {
          console.error("[DPM Page] Error deleting misplaced default project:", deleteError);
        }
      }
      
      // Keep only one default project in the correct department
      if (correctlyPlacedDefaults.length > 1) {
        console.log("[DPM Page] Found multiple default projects in default department, keeping only one");
        
        // Keep the first one, delete the rest
        const projectsToDelete = correctlyPlacedDefaults.slice(1);
        
        for (const project of projectsToDelete) {
          try {
            await projectsApi.delete(project.projectId);
            console.log("[DPM Page] Deleted duplicate default project:", project.projectId);
          } catch (deleteError) {
            console.error("[DPM Page] Error deleting duplicate project:", deleteError);
          }
        }
      }
      
      // If there are no correctly placed default projects, we'll let the creation logic handle it
      if (correctlyPlacedDefaults.length === 0) {
        console.log("[DPM Page] No default project in default department, creation logic will handle it");
      }
      
      // Refresh projects after cleanup
      await fetchProjects();
      
      // Refresh usage metrics after cleanup
      await refreshProjectsUsage();
      
      const totalCleaned = misplacedDefaults.length + Math.max(0, correctlyPlacedDefaults.length - 1);
      if (totalCleaned > 0) {
        setOperationSuccess(`Cleaned up ${totalCleaned} duplicate/misplaced default project(s)`);
      }
      
    } catch (error) {
      console.error('[DPM Page] Error cleaning up duplicate default projects:', error);
    }
  }, [departments, fetchProjects, setOperationSuccess, refreshProjectsUsage]);

  // Add this useEffect to run cleanup when page loads
  useEffect(() => {
    if (
      businessId && 
      Array.isArray(departments) && 
      Array.isArray(projects) &&
      role === "ROLE_ADMIN" && 
      isBusinessOwner === "yes"
    ) {
      // First cleanup any duplicates, then create if needed
      cleanupDuplicateDefaultProjects();
    }
  }, [businessId, departments, projects, role, isBusinessOwner, cleanupDuplicateDefaultProjects]);

  // Add comprehensive cleanup functions for multiple defaults
  const cleanupMultipleDefaultDepartments = useCallback(async () => {
    try {
      console.log("[DPM Page] Checking for multiple default departments");
      
      if (!businessId) {
        return;
      }
      
      // Get all departments for this business
      const allDepartmentsResponse = await departmentsApi.getByBusinessId(businessId);
      const allDepartments = allDepartmentsResponse.data || [];
      
      // Find all departments named "default" (case-insensitive)
      const defaultDepartments = allDepartments.filter(dept => 
        dept.departmentName?.toLowerCase().trim() === "default"
      );
      
      if (defaultDepartments.length > 1) {
        console.log("[DPM Page] Found multiple default departments, cleaning up", defaultDepartments);
        
        // Keep the first one (oldest), delete the rest
        const departmentsToDelete = defaultDepartments.slice(1);
        
        // Before deleting departments, move their projects to the main default department
        const keepDepartment = defaultDepartments[0];
        const keepDepartmentId = keepDepartment.departmentId || keepDepartment.id;
        
        for (const dept of departmentsToDelete) {
          try {
            const deptId = dept.departmentId || dept.id;
            
            // Get projects in this duplicate department
            const allProjectsResponse = await projectsApi.getAll();
            const allProjects = allProjectsResponse.data || [];
            const projectsInDuplicateDept = allProjects.filter(p => p.departmentId === deptId);
            
            // Move non-default projects to the main default department
            // Delete default projects (since main department should have the only default project)
            for (const project of projectsInDuplicateDept) {
              if (project.name?.toLowerCase().trim() === "default topic") {
                // Delete duplicate default projects
                await projectsApi.delete(project.projectId);
                console.log("[DPM Page] Deleted duplicate default project:", project.projectId);
              } else {
                // Move regular projects to main default department
                await projectsApi.update(project.projectId, {
                  ...project,
                  departmentId: keepDepartmentId
                });
                console.log("[DPM Page] Moved project to main default department:", project.projectId);
              }
            }
            
            // Now delete the duplicate department
            await departmentsApi.delete(deptId);
            console.log("[DPM Page] Deleted duplicate default department:", deptId);
            
          } catch (deleteError) {
            console.error("[DPM Page] Error deleting duplicate department:", deleteError);
          }
        }
        
        // Refresh data after cleanup
        await Promise.all([
          fetchDepartments(),
          fetchProjects(),
          refreshDepartmentsUsage(),
          refreshProjectsUsage()
        ]);
        setOperationSuccess(`Cleaned up ${departmentsToDelete.length} duplicate default department(s)`);
      }
      
    } catch (error) {
      console.error('[DPM Page] Error cleaning up multiple default departments:', error);
    }
  }, [businessId, fetchDepartments, fetchProjects, setOperationSuccess, refreshDepartmentsUsage, refreshProjectsUsage]);

  // Master cleanup function that handles all default cleanup scenarios
  const performComprehensiveDefaultCleanup = useCallback(async () => {
    try {
      console.log("[DPM Page] Starting comprehensive default cleanup");
      
      // Step 1: Clean up multiple default departments first
      await cleanupMultipleDefaultDepartments();
      
      // Step 2: Clean up duplicate/misplaced default projects
      await cleanupDuplicateDefaultProjects();
      
      console.log("[DPM Page] Comprehensive default cleanup completed");
      
    } catch (error) {
      console.error('[DPM Page] Error during comprehensive default cleanup:', error);
    }
  }, [cleanupMultipleDefaultDepartments, cleanupDuplicateDefaultProjects]);

  // Update the existing useEffect to use the comprehensive cleanup
  useEffect(() => {
    if (
      businessId && 
      Array.isArray(departments) && 
      Array.isArray(projects) &&
      role === "ROLE_ADMIN" && 
      isBusinessOwner === "yes"
    ) {
      // Perform comprehensive cleanup first, then create defaults if needed
      performComprehensiveDefaultCleanup();
    }
  }, [businessId, departments, projects, role, isBusinessOwner, performComprehensiveDefaultCleanup]);

  // Function to manually refresh subscription usage
  const handleManualRefresh = useCallback(async () => {
    console.log('[DPM Page] Manual refresh requested');
    setIsRefreshingSubscription(true);
    try {
      // Get fresh subscription usage from backend
      const result = await getSubscriptionUsageFromBackend();
      
      // Also fetch comprehensive usage data
      const usageResult = await fetchUsageData();
      
      // Refresh actual subscription limits from Stripe
      await fetchActualSubscriptionLimits();
      
      if (result || usageResult) {
        setOperationSuccess('Subscription usage refreshed successfully');
        console.log('[DPM Page] Manual refresh completed');
      } else {
        setOperationError('Failed to get subscription usage from backend');
      }
    } catch (error) {
      console.error('[DPM Page] Error during manual refresh:', error);
      setOperationError('Failed to refresh subscription usage');
    } finally {
      setIsRefreshingSubscription(false);
    }
  }, [getSubscriptionUsageFromBackend, fetchUsageData, fetchActualSubscriptionLimits, setOperationSuccess, setOperationError]);

  return (
    <div className="DepartmentProjectManagementPage">
      <Helmet>
        <title>{businessName ? `${businessName} - Department Management` : 'Department Management'} | Support Hub</title>
      </Helmet>

      <main className="main-content">
        <div className="page-header">
          <h2>Department & Project Management</h2>
          {isBusinessOwner === "yes" && (
            <div className="subscription-usage-display">
              <span className="usage-text">
                Current Projects: {realTimeProjectsCount}
                {projectLimit !== -1 && ` / ${projectLimit}`}
                {projectLimit === -1 && ' (Unlimited)'}
              </span>
              <button 
                className="refresh-button"
                onClick={handleManualRefresh}
                disabled={isRefreshingSubscription}
              >
                {isRefreshingSubscription ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          )}
        </div>

        {/* Compact top header - consolidate breadcrumb and headers */}
        <div className="compact-page-header">
          <div className="breadcrumb-compact">
            <Link to="/business-overview" className="breadcrumb-link">Business Overview</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">ai widget</span>
          </div>
          
          <div className="consolidated-titles">
            <div className="business-section">
              <h1 className="business-name">{businessName}</h1>
              <span className="section-type">Organization</span>
            </div>
            <div className="divider-line"></div>
            <div className="department-section">
              {departments.length > 0 && (
                <>
                  <h2 className="department-name">{departments[0]?.departmentName || 'ai widget'}</h2>
                  <span className="section-type">Expertise Area</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Help Mode Toggle - positioned in top right */}
        <div className="help-mode-toggle-container">
          <label className="help-mode-toggle">
            <input
              type="checkbox"
              checked={helpModeEnabled}
              onChange={(e) => setHelpModeEnabled(e.target.checked)}
            />
            <span className="help-mode-label">Help Mode</span>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="operation-error-message" role="alert">
            <button className="close-button" onClick={() => setError(null)} aria-label="Close error message">×</button>
            {error}
          </div>
        )}

        {/* Operation Error Display */}
        {operationError && (
          <div className="operation-error-message" role="alert">
            <button className="close-button" onClick={() => setOperationError(null)} aria-label="Close error message">×</button>
            {operationError}
          </div>
        )}

        {/* Success Message Display */}
        {operationSuccess && (
          <div className="operation-success-message" role="status">
            <button className="close-button" onClick={() => setOperationSuccess(null)} aria-label="Close success message">×</button>
            {operationSuccess}
          </div>
        )}

        {/* Subscription Refresh Indicator */}
        {isRefreshingSubscription && (
          <div className="subscription-refresh-indicator" role="status">
            <span>🔄 Getting fresh subscription data from backend...</span>
          </div>
        )}

        {/* Current Projects Count Indicator */}
        {isBusinessOwner === "yes" && (
          <div className="current-projects-indicator" role="status">
            <span>📊 Current Projects: {realTimeProjectsCount}</span>
            {projectLimit !== -1 && <span> / {projectLimit}</span>}
            {projectLimit === -1 && <span> (Unlimited)</span>}
            <button 
              className="refresh-button" 
              onClick={handleManualRefresh}
              disabled={isRefreshingSubscription}
              title="Refresh subscription usage from backend"
            >
              {isRefreshingSubscription ? '⏳' : '🔄'}
            </button>
            {isRefreshingSubscription && (
              <span className="sync-indicator">🔄 Syncing with backend...</span>
            )}
          </div>
        )}

        {/* Comprehensive Usage Counter */}
        {isBusinessOwner === "yes" && (
          <div className="comprehensive-usage-counter" role="status">
            <h3>📊 Subscription Usage Overview</h3>
            <div className="usage-limit-source">
              <span className={`limit-source ${actualSubscriptionLimits.maxProjectsPerDepartment !== maxProjectsPerDepartment ? 'actual' : 'context'}`}>
                {actualSubscriptionLimits.maxProjectsPerDepartment !== maxProjectsPerDepartment ? 
                  '✅ Using actual subscription limits' : 
                  '⚠️ Using context limits (fallback)'}
              </span>
            </div>
            <div className="usage-metrics-grid">
              {/* Conversations */}
              <div className={`usage-metric ${getUsageStatus(usageCounters.conversationsCount, actualSubscriptionLimits.maxConversations)}`}>
                <div className="metric-header">
                  <span className="metric-icon">💬</span>
                  <span className="metric-name">Conversations</span>
                </div>
                <div className="metric-count">
                  {usageCounters.conversationsCount}
                  {actualSubscriptionLimits.maxConversations !== -1 && ` / ${actualSubscriptionLimits.maxConversations}`}
                  {actualSubscriptionLimits.maxConversations === -1 && ' (Unlimited)'}
                </div>
                {actualSubscriptionLimits.maxConversations !== -1 && (
                  <div className="metric-progress">
                    <div 
                      className="progress-bar" 
                      style={{width: `${calculateUsagePercentage(usageCounters.conversationsCount, actualSubscriptionLimits.maxConversations)}%`}}
                    ></div>
                    <span className="progress-text">{calculateUsagePercentage(usageCounters.conversationsCount, actualSubscriptionLimits.maxConversations)}%</span>
                  </div>
                )}
              </div>

              {/* Experts */}
              <div className={`usage-metric ${getUsageStatus(usageCounters.expertsCount, actualSubscriptionLimits.maxExperts)}`}>
                <div className="metric-header">
                  <span className="metric-icon">👥</span>
                  <span className="metric-name">Experts</span>
                </div>
                <div className="metric-count">
                  {usageCounters.expertsCount}
                  {actualSubscriptionLimits.maxExperts !== -1 && ` / ${actualSubscriptionLimits.maxExperts}`}
                  {actualSubscriptionLimits.maxExperts === -1 && ' (Unlimited)'}
                </div>
                {actualSubscriptionLimits.maxExperts !== -1 && (
                  <div className="metric-progress">
                    <div 
                      className="progress-bar" 
                      style={{width: `${calculateUsagePercentage(usageCounters.expertsCount, actualSubscriptionLimits.maxExperts)}%`}}
                    ></div>
                    <span className="progress-text">{calculateUsagePercentage(usageCounters.expertsCount, actualSubscriptionLimits.maxExperts)}%</span>
                  </div>
                )}
              </div>

              {/* Departments */}
              <div className={`usage-metric ${getUsageStatus(usageCounters.departmentsCount, actualSubscriptionLimits.maxDepartments)}`}>
                <div className="metric-header">
                  <span className="metric-icon">🏢</span>
                  <span className="metric-name">Departments</span>
                </div>
                <div className="metric-count">
                  {usageCounters.departmentsCount}
                  {actualSubscriptionLimits.maxDepartments !== -1 && ` / ${actualSubscriptionLimits.maxDepartments}`}
                  {actualSubscriptionLimits.maxDepartments === -1 && ' (Unlimited)'}
                </div>
                {actualSubscriptionLimits.maxDepartments !== -1 && (
                  <div className="metric-progress">
                    <div 
                      className="progress-bar" 
                      style={{width: `${calculateUsagePercentage(usageCounters.departmentsCount, actualSubscriptionLimits.maxDepartments)}%`}}
                    ></div>
                    <span className="progress-text">{calculateUsagePercentage(usageCounters.departmentsCount, actualSubscriptionLimits.maxDepartments)}%</span>
                  </div>
                )}
              </div>

              {/* Projects */}
              <div className={`usage-metric ${getUsageStatus(usageCounters.projectsCount, actualSubscriptionLimits.maxProjectsPerDepartment)}`}>
                <div className="metric-header">
                  <span className="metric-icon">📁</span>
                  <span className="metric-name">Projects</span>
                </div>
                <div className="metric-count">
                  {usageCounters.projectsCount}
                  {actualSubscriptionLimits.maxProjectsPerDepartment !== -1 && ` / ${actualSubscriptionLimits.maxProjectsPerDepartment}`}
                  {actualSubscriptionLimits.maxProjectsPerDepartment === -1 && ' (Unlimited)'}
                </div>
                {actualSubscriptionLimits.maxProjectsPerDepartment !== -1 && (
                  <div className="metric-progress">
                    <div 
                      className="progress-bar" 
                      style={{width: `${calculateUsagePercentage(usageCounters.projectsCount, actualSubscriptionLimits.maxProjectsPerDepartment)}%`}}
                    ></div>
                    <span className="progress-text">{calculateUsagePercentage(usageCounters.projectsCount, actualSubscriptionLimits.maxProjectsPerDepartment)}%</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="usage-actions">
              <button 
                className="refresh-usage-button"
                onClick={handleManualRefresh}
                disabled={isRefreshingSubscription}
                title="Refresh all usage metrics from backend"
              >
                {isRefreshingSubscription ? '⏳ Refreshing...' : '🔄 Refresh Usage'}
              </button>
              {isRefreshingSubscription && (
                <span className="refresh-status">🔄 Syncing with backend...</span>
              )}
            </div>
          </div>
        )}

        {/* Project Limit Warning */}
        {isBusinessOwner === "yes" && projectLimit !== -1 && realTimeProjectsCount >= projectLimit && (
          <div className="project-limit-warning" role="alert">
            <span>⚠️ Project limit reached ({realTimeProjectsCount}/{projectLimit}). Cannot create more projects.</span>
          </div>
        )}

        {/* Empty state with clear call to action */}
        {Array.isArray(departments) && departments.length === 0 && (
          <section className="empty-state">
            <h2>
              {departmentId 
                ? "No projects have been added to this department yet" 
                : `No departments have been added to ${businessName}`}
            </h2>
            {/* Only show Add Department button when NOT on a specific department page */}
            {!departmentId && (role === 'ADMIN' || isBusinessOwner === 'yes') && (
              <Tooltip text="Create a new department for organizing projects">
                <button onClick={openAddDepartmentModal} aria-label="Add your first department">Add Department</button>
              </Tooltip>
            )}
          </section>
        )}

        {/* Main content - Use the proper DepartmentProjectsGrid component */}
        {Array.isArray(departments) && departments.length > 0 && (
          <>
            {console.log('[DPM Page] Passing maxProjectsPerDepartment to DepartmentProjectsGrid:', maxProjectsPerDepartment)}
            {console.log('[DPM Page] Passing projectPermissions to DepartmentProjectsGrid:', projectPermissions)}
            <DepartmentProjectsGrid
              key={refreshKey} // Force re-render when refresh key changes
              departments={departments}
              projects={projects}
              projectPermissions={projectPermissions} // Pass permissions data
              isBusinessOwner={isBusinessOwner}
              onOpenModal={openModalHandler}
              DPGbusinessName={businessName}
              singleDepartmentView={!!departmentId}
              helpModeEnabled={helpModeEnabled}
              currentDepartmentId={departmentId}
              onOpenUpdateDepartmentModal={openUpdateDepartmentModal}
              onDeleteDepartment={deleteDepartment}
              onOpenUpdateProjectModal={openUpdateProjectModal}
              onDeleteProject={deleteProject}
              onOpenAddProjectModal={openAddProjectModal}
              onOpenAddDepartmentModal={openAddDepartmentModal}
              currentProjectsCount={currentProjectsCount}
              maxProjectsPerDepartment={maxProjectsPerDepartment}
              permissionRefreshTrigger={permissionRefreshTrigger} // Pass permission refresh trigger
            />
          </>
        )}

        {legacyModalVisible && (
          <>
            {legacyModalType === 'project' && (
              <ProjectModal
                onClose={() => setLegacyModalVisible(false)}
                onSubmit={handleModalSubmit}
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
            {legacyModalType === 'department' && (
              <DepartmentModal
                onClose={() => setLegacyModalVisible(false)}
                onSubmit={() => handleModalSubmit()}
                departmentName={newDepartmentName}
                setDepartmentName={setNewDepartmentName}
                departmentDescription={newDepartmentDescription}
                setDepartmentDescription={setNewDepartmentDescription}
                isUpdate={false}
              />
            )}
            {legacyModalType === 'updateProject' && (
              <ProjectModal
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
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
            {legacyModalType === 'updateDepartment' && (
              <DepartmentModal
                onClose={() => setLegacyModalVisible(false)}
                onSubmit={() => handleModalSubmit()}
                departmentName={newDepartmentName}
                setDepartmentName={setNewDepartmentName}
                departmentDescription={newDepartmentDescription}
                setDepartmentDescription={setNewDepartmentDescription}
                isUpdate={true}
              />
            )}
          </>
        )}

        {/* Upload Data Modal - Improved validation */}
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

        {/* Question Overview Modal - Improved validation */}
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
                businessId={businessId}
                onClose={closeActiveModal} // Simplified - modal handles refresh internally
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

export default DepartmentProjectManagementPage;