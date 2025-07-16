import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (pageName) => {
  const startTimeRef = useRef(null);
  const metricsRef = useRef({
    loadTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0
  });

  useEffect(() => {
    startTimeRef.current = performance.now();
    console.log(`📊 [Performance] ${pageName} - Page started loading`);

    return () => {
      if (startTimeRef.current) {
        const totalTime = performance.now() - startTimeRef.current;
        console.log(`📊 [Performance] ${pageName} - Total page time: ${Math.round(totalTime)}ms`);
      }
    };
  }, [pageName]);

  const trackLoadComplete = (loadTime) => {
    metricsRef.current.loadTime = loadTime;
    console.log(`📊 [Performance] ${pageName} - Data loaded in: ${Math.round(loadTime)}ms`);
  };

  const trackCacheHit = () => {
    metricsRef.current.cacheHits++;
    console.log(`📦 [Performance] ${pageName} - Cache hit! Total hits: ${metricsRef.current.cacheHits}`);
  };

  const trackCacheMiss = () => {
    metricsRef.current.cacheMisses++;
    console.log(`🌐 [Performance] ${pageName} - Cache miss. Total misses: ${metricsRef.current.cacheMisses}`);
  };

  const trackApiCall = () => {
    metricsRef.current.apiCalls++;
    console.log(`🔗 [Performance] ${pageName} - API call made. Total calls: ${metricsRef.current.apiCalls}`);
  };

  const getMetrics = () => metricsRef.current;

  return {
    trackLoadComplete,
    trackCacheHit,
    trackCacheMiss,
    trackApiCall,
    getMetrics
  };
};

export default usePerformanceMonitor; 