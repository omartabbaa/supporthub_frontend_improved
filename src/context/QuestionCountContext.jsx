import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { questions as questionsApi } from '../services/ApiService';

const QuestionCountContext = createContext();

export const QuestionCountProvider = ({ children }) => {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState({});
  const intervalRef = useRef(null);
  const fetchTimesRef = useRef({});

  // Fetch counts for a specific project
  const fetchProjectCount = useCallback(async (projectId, force = false) => {
    if (!projectId) return;
    
    // Throttle API calls per project
    const now = Date.now();
    if (!force && fetchTimesRef.current[projectId] && 
        now - fetchTimesRef.current[projectId] < 10000) {
      return;
    }
    
    fetchTimesRef.current[projectId] = now;
    setLoading(prev => ({ ...prev, [projectId]: true }));
    
    try {
      const response = await questionsApi.getCountsByProjectId(projectId);
      setCounts(prev => ({
        ...prev,
        [projectId]: response.data.unansweredQuestions
      }));
    } catch (error) {
      console.error(`Error fetching count for project ${projectId}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [projectId]: false }));
    }
  }, []);

  // Fetch all project counts that have been requested
  const fetchAllCounts = useCallback(() => {
    const projectIds = Object.keys(fetchTimesRef.current);
    projectIds.forEach(id => fetchProjectCount(id));
  }, [fetchProjectCount]);

  // Set up a single interval for all counts
  useEffect(() => {
    intervalRef.current = setInterval(fetchAllCounts, 120000);
    
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [fetchAllCounts]);

  // Get or refresh a specific project count
  const getProjectCount = useCallback((projectId) => {
    if (projectId && !fetchTimesRef.current[projectId]) {
      fetchProjectCount(projectId, true);
    }
    
    return {
      count: counts[projectId] || 0,
      loading: loading[projectId] || false
    };
  }, [counts, loading, fetchProjectCount]);

  return (
    <QuestionCountContext.Provider value={{ getProjectCount, refreshAllCounts: fetchAllCounts }}>
      {children}
    </QuestionCountContext.Provider>
  );
};

export const useQuestionCount = (projectId) => {
  const context = useContext(QuestionCountContext);
  if (!context) {
    throw new Error('useQuestionCount must be used within a QuestionCountProvider');
  }
  
  return context.getProjectCount(projectId);
};

export const useRefreshAllCounts = () => {
  const context = useContext(QuestionCountContext);
  if (!context) {
    throw new Error('useRefreshAllCounts must be used within a QuestionCountProvider');
  }
  
  return context.refreshAllCounts;
}; 