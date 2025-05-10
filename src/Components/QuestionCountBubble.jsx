import React, { useState, useEffect, useRef } from 'react';
import { questions as questionsApi } from '../services/ApiService';
import './QuestionCountBubble.css';
import { useUserPermissions } from '../hooks/useUserPermissions';

const QuestionCountBubble = ({ projectId }) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { hasProjectPermission } = useUserPermissions();
  const fetchTimeRef = useRef(0);
  const intervalRef = useRef(null);

  const fetchCount = async () => {
    // Don't fetch more than once every 15 seconds
    const now = Date.now();
    if (now - fetchTimeRef.current < 15000) return;
    
    fetchTimeRef.current = now;
    
    try {
      const response = await questionsApi.getCountsByProjectId(projectId);
      setCount(response.data.unansweredQuestions);
    } catch (error) {
      console.error('Error fetching question count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchCount();
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set a new interval
      intervalRef.current = setInterval(fetchCount, 120000); // 2 minutes
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectId]);

  if (count < 1 || !hasProjectPermission(projectId)) return null;
  
  return (
    <div className="question-count-bubble">
      {loading ? '...' : count}
    </div>
  );
};

export default QuestionCountBubble;