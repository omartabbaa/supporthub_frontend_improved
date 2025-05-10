import { useState, useEffect } from 'react';
import { permissions as permissionsApi } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';

/**
 * Custom hook to fetch and cache user permissions
 * @returns {Object} User permissions data and loading state
 */
export const useUserPermissions = () => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const { userId } = useUserContext();

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!userId) {
        setPermissionsLoading(false);
        return;
      }

      try {
        setPermissionsLoading(true);
        const response = await permissionsApi.getByUserId(userId);
        setUserPermissions(response.data);
        console.log('User permissions loaded:', response.data);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setUserPermissions([]);
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchUserPermissions();
  }, [userId]);

  // Check if user has permission for a specific project
  const hasProjectPermission = (projectId) => {
    if (!userPermissions?.length || !projectId) return false;
    
    return userPermissions.some(permission => 
      permission.projectId === parseInt(projectId) && permission.canAnswer === true
    );
  };

  return { userPermissions, permissionsLoading, hasProjectPermission };
}; 