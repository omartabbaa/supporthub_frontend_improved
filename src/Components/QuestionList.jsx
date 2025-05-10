// QuestionList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Like from '../assets/Button/Like.png';
import Tooltip from './Tooltip';
import { useUserContext } from '../context/LoginContext';
import { questions as questionsApi, users as usersApi } from '../services/ApiService';

const QuestionList = ({ 
  questions, 
  onDelete, 
  onLike, 
  hasPermission, 
  businessName, 
  department, 
  project, 
  onStatusChange,
  pendingUsersMap = {} // Default to empty object if not provided
}) => {
  // Make sure these props are defined at the top level
  console.log("Navigation params in QuestionList:", { businessName, department, project }); // Debug log
  
  // Add UserContext to get current user's ID
  const { userId } = useUserContext();
  
  // Enhanced date formatter with more specific time
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Use relative time for recent questions
    if (diffDays < 1) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes < 1) {
          return "Just now";
        }
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } 
    // For questions older than a day, show the full date and time
    else {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      };
      return date.toLocaleDateString(undefined, options);
    }
  };

  // Function to handle taking ownership of a question
  const handleTakeQuestion = async (questionId, e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    
    try {
      // Call the toggle status endpoint with the current user's ID
      const response = await questionsApi.toggleStatus(questionId, userId);
      
      // Notify parent component about the status change to refresh the list
      if (onStatusChange) {
        onStatusChange(response.data);
      }
    } catch (error) {
      console.error('Error taking question:', error);
      // You could add error handling UI here
    }
  };

  // Debug logging for each question
  questions.forEach(question => {
    console.log(`Question "${question.title}": status=${question.status}, hasPermission=${hasPermission}`);
  });

  return (
    <div className="question-overview-container" data-tooltip="This section shows all questions for this project sorted by most recent">
      {questions.map((question) => {
        // Log each question being processed
        const shouldShowTakeButton = hasPermission && question.status === 'Open';
        
        return (
          <div key={question.id} className={`question-card-wrapper ${!hasPermission ? 'no-permission' : ''}`}>
            <Link 
              to={`/question-detail/${encodeURIComponent(businessName || "Unknown")}/${encodeURIComponent(department || "Unknown")}/${encodeURIComponent(project || "Unknown")}/${question.id}/${encodeURIComponent(question.title)}/${encodeURIComponent(question.question)}/${question.projectId}`}
              className="question-card-link"
            >
              <div 
                className={question.status === 'Closed' ? 'question-overview-item-red' : 'question-overview-item'}
              >
                <div className="Question-Title-delete-Button-Container">
                  <h3>{question.title}</h3>
                  
                  {/* Action buttons container - separate from the title for clarity */}
                  {hasPermission && (
                    <div className="question-actions">
                      {shouldShowTakeButton && (
                        <button 
                          className="take-question-button" 
                          onClick={(e) => handleTakeQuestion(question.id, e)}
                          title="Take ownership of this question"
                        >
                          ✓ Take Question
                        </button>
                      )}
                      <button 
                        className="Delete-Button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDelete(question.id);
                        }}
                        aria-label="Delete question"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="Question-Card-Container">
                  <p>{question.question}</p>
                  {!hasPermission && <p className="no-permission-text">No Permission to Answer Questions</p>}
                  {/* Show assigned status if question is pending */}
                  {question.status === 'Pending' && (
                    <div className="question-assigned-status">
                      <span className="status-badge pending">Pending</span>
                      {console.log(`PENDING QUESTION ${question.id} AGENT ID:`, question.assignedAgentId)}
                      
                      {question.assignedAgentId && question.assignedAgentId > 0 ? (
                        <div className="assigned-agent-banner">
                          <div className="assigned-agent-icon">👤</div>
                          <div className="assigned-agent-details">
                            <span className="assigned-label">Currently being addressed by:</span>
                            <span className="assigned-name">
                              {question.assignedAgentId === userId ? (
                                <strong>You</strong>
                              ) : (
                                <strong>
                                  {pendingUsersMap[question.assignedAgentId] ? 
                                    (pendingUsersMap[question.assignedAgentId].name || 
                                     pendingUsersMap[question.assignedAgentId].email || 
                                     `Agent #${question.assignedAgentId}`) : 
                                    `Agent #${question.assignedAgentId}`}
                                </strong>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="assigned-agent-banner">
                          <div className="assigned-agent-icon">⚠️</div>
                          <div className="assigned-agent-details">
                            <span className="assigned-label">Status:</span>
                            <span className="assigned-name">
                              <strong>Processing</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="Question-Likes-Container">
                  <div className="question-status-date">
                    <span>Status: {question.status}</span>
                    <span className="question-date">• Asked {formatDate(question.createdAt)}</span>
                  </div>
                  <div className="Question-Likes-Button-Container">
                    <span>{question.likes} likes</span>
                    <button 
                      className="Like-Button" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onLike(question.id);
                      }}
                      aria-label="Like question"
                    >
                      <img src={Like} alt="Like" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionList;
