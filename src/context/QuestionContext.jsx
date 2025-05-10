import React, { createContext, useState, useContext, useEffect } from 'react';
import { questions as questionsApi } from '../services/ApiService';

const QuestionContext = createContext();

export const useQuestionContext = () => useContext(QuestionContext);

export const QuestionProvider = ({ children }) => {
  const [questionCounts, setQuestionCounts] = useState({});
  
  // Function to fetch count of unanswered questions for a specific project
  const fetchUnansweredCount = async (projectId) => {
    try {
      const response = await questionsApi.getAll();
      const unansweredQuestions = response.data.filter(
        question => question.projectId === parseInt(projectId) && question.status === 'Open'
      );
      
      // Update the count for this specific project
      setQuestionCounts(prev => ({
        ...prev,
        [projectId]: unansweredQuestions.length
      }));
      
      return unansweredQuestions.length;
    } catch (error) {
      console.error('Error fetching question count:', error);
      return 0;
    }
  };
  
  // Function to refresh counts for all stored projects
  const refreshAllCounts = async () => {
    try {
      const projectIds = Object.keys(questionCounts);
      const newCounts = {};
      
      for (const projectId of projectIds) {
        const count = await fetchUnansweredCount(projectId);
        newCounts[projectId] = count;
      }
      
      setQuestionCounts(newCounts);
    } catch (error) {
      console.error('Error refreshing question counts:', error);
    }
  };
  
  // Function to increment count when a new question is asked
  const incrementCount = (projectId) => {
    setQuestionCounts(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || 0) + 1
    }));
  };
  
  // Function to decrement count when a question is answered
  const decrementCount = (projectId) => {
    setQuestionCounts(prev => ({
      ...prev,
      [projectId]: Math.max(0, (prev[projectId] || 0) - 1)
    }));
  };
  
  const value = {
    questionCounts,
    fetchUnansweredCount,
    refreshAllCounts,
    incrementCount,
    decrementCount
  };
  
  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
}; 