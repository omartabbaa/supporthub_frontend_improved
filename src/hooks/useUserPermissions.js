import { useState, useEffect, useCallback } from 'react';
import { permissions as permissionsApi, setAuthToken } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';

/**
 * Custom hook to fetch and cache user permissions
 * @returns {Object} User permissions data and loading state
 */
export const useUserPermissions = () => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const { userId, token } = useUserContext();

  console.log('[useUserPermissions] 🔄 Hook initialized/re-rendered', { 
    userId, 
    hasToken: !!token,
    currentPermissionsLength: userPermissions?.length || 0,
    permissionsLoading
  });

  // Extract fetch logic into reusable function
  const fetchUserPermissions = useCallback(async () => {
    console.log('[useUserPermissions] 📥 fetchUserPermissions called', { 
      userId, 
      hasToken: !!token,
      currentTime: new Date().toISOString()
    });

    if (!userId) {
      console.log('[useUserPermissions] ❌ No userId provided, setting loading to false');
      setPermissionsLoading(false);
      return;
    }

    try {
      console.log('[useUserPermissions] 🔄 Starting permissions fetch...');
      setPermissionsLoading(true);
      
      if (token) {
        console.log('[useUserPermissions] 🔑 Setting auth token');
        setAuthToken(token);
      } else {
        console.warn('[useUserPermissions] ⚠️ No token available for request');
      }
      
      console.log('[useUserPermissions] 🌐 Making API call to getByUserId:', userId);
      const response = await permissionsApi.getByUserId(userId);
      
      console.log('[useUserPermissions] ✅ API response received:', {
        data: response.data,
        dataLength: response.data?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      setUserPermissions(response.data);
      console.log('[useUserPermissions] 💾 User permissions state updated');
      
    } catch (error) {
      console.error('[useUserPermissions] ❌ Error fetching user permissions:', {
        error,
        errorMessage: error.message,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        timestamp: new Date().toISOString()
      });
      setUserPermissions([]);
    } finally {
      console.log('[useUserPermissions] 🏁 Setting loading to false');
      setPermissionsLoading(false);
    }
  }, [userId, token]);

  // Initial fetch on mount/userId change
  useEffect(() => {
    console.log('[useUserPermissions] 🎯 useEffect triggered for initial fetch', {
      userId,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Check if user has permission for a specific project
  const hasProjectPermission = (projectId) => {
    console.log('[useUserPermissions] 🔍 hasProjectPermission called', { 
      projectId,
      userPermissionsLength: userPermissions?.length || 0,
      userPermissions: userPermissions,
      timestamp: new Date().toISOString()
    });

    if (!userPermissions?.length || !projectId) {
      console.log('[useUserPermissions] ❌ No permissions or no projectId', {
        hasPermissions: !!userPermissions?.length,
        projectId
      });
      return false;
    }
    
    const projectIdInt = parseInt(projectId);
    console.log('[useUserPermissions] 🔢 Checking projectId as integer:', projectIdInt);
    
    const matchingPermissions = userPermissions.filter(permission => {
      const permissionProjectId = parseInt(permission.projectId);
      const matches = permissionProjectId === projectIdInt;
      const canAnswer = permission.canAnswer === true;
      
      console.log('[useUserPermissions] 🔎 Permission check:', {
        permissionId: permission.permissionId,
        permissionProjectId,
        projectIdInt,
        matches,
        canAnswer,
        permission
      });
      
      return matches && canAnswer;
    });
    
    const hasPermission = matchingPermissions.length > 0;
    
    console.log('[useUserPermissions] 🎯 hasProjectPermission result:', {
      projectId: projectIdInt,
      hasPermission,
      matchingPermissions,
      allPermissions: userPermissions,
      timestamp: new Date().toISOString()
    });
    
    return hasPermission;
  };

  // Add refresh function for manual permission updates
  const refreshUserPermissions = useCallback(async () => {
    console.log('[useUserPermissions] 🔄 refreshUserPermissions called manually!', {
      currentTime: new Date().toISOString(),
      userId,
      hasToken: !!token,
      currentPermissionsLength: userPermissions?.length || 0
    });
    
    try {
      await fetchUserPermissions();
      console.log('[useUserPermissions] ✅ Manual refresh completed successfully');
    } catch (error) {
      console.error('[useUserPermissions] ❌ Manual refresh failed:', error);
    }
  }, [fetchUserPermissions, userPermissions?.length, userId, token]);

  console.log('[useUserPermissions] 📊 Hook returning:', {
    userPermissions: userPermissions,
    permissionsLoading,
    hasRefreshFunction: typeof refreshUserPermissions === 'function',
    timestamp: new Date().toISOString()
  });

  return { 
    userPermissions, 
    permissionsLoading, 
    hasProjectPermission,
    refreshUserPermissions
  };
}; 