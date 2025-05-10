import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useQuestionRefresh = (refreshFunction) => {
  const location = useLocation();
  const lastRefreshTimeRef = useRef(0);
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current > 15000) { // Minimum 15s between refreshes
      lastRefreshTimeRef.current = now;
      refreshFunction();
    }
  }, [location, refreshFunction]);
}; 