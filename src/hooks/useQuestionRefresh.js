import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to trigger question count refresh when navigating back from the question detail page
 * @param {Function} refreshFunction - Function to call for refreshing data
 */
export const useQuestionRefresh = (refreshFunction) => {
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're navigating back from question detail or creation
    const fromQuestionPage = document.referrer.includes('question-detail') || 
                           document.referrer.includes('question-overview');
    
    if (fromQuestionPage) {
      refreshFunction();
    }
  }, [location.pathname, refreshFunction]);
  
  return null;
}; 