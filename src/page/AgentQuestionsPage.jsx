import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { agentQuestions as agentQuestionsApi, questions as questionsApi, users as usersApi, answers as answersApi } from '../services/ApiService';
import SideNavbar from '../Components/SideNavbar';
import TextArea from '../Components/TextArea';
import AnswerList from '../Components/AnswerList';
import './AgentQuestionsPage.css';

const AgentQuestionsPage = () => {
  const { userId, role } = useUserContext();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState({});
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [answerText, setAnswerText] = useState({});
  const [submitStatus, setSubmitStatus] = useState({});
  const [questionAnswers, setQuestionAnswers] = useState({});

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    fetchQuestions();
  }, [userId, statusFilter, sortNewestFirst]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      let response;
      
      // Only use the status filter in the API call if it's not PENDING
      if (statusFilter === 'PENDING') {
        console.log(`Fetching all questions for user ID: ${userId} (will filter PENDING client-side)`);
        response = await agentQuestionsApi.getForUser(userId, '');
        
        // Client-side filtering for PENDING status
        response.data = response.data.filter(q => q.status === 'PENDING');
        console.log(`Filtered to ${response.data.length} PENDING questions client-side`);
      } else {
        console.log(`Fetching questions for user ID: ${userId} with filter: ${statusFilter || 'ALL'}`);
        response = await agentQuestionsApi.getForUser(userId, statusFilter);
        console.log(`API returned ${response.data.length} questions with filter: ${statusFilter || 'ALL'}`);
      }
      
      // Sort questions by date based on sortNewestFirst
      const sortedQuestions = response.data.sort((a, b) => {
        const sortResult = sortNewestFirst 
          ? new Date(b.createdAt) - new Date(a.createdAt)  // Newest first
          : new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
        
        return sortResult;
      });
      
      console.log(`Sorted ${sortedQuestions.length} questions, newest first: ${sortNewestFirst}`);
      
      // Regular processing continues...
      setQuestions(sortedQuestions);
      setError(null);
    } catch (error) {
      console.error('Error fetching agent questions:', error);
      setError('Failed to load questions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeQuestion = async (questionId) => {
    try {
      await questionsApi.toggleStatus(questionId, userId);
      fetchQuestions();
    } catch (error) {
      console.error('Error taking ownership of question:', error);
      setError('Failed to take ownership of question. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    
    // Convert to seconds, minutes, hours, days
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Return appropriate time format
    if (diffInSecs < 60) {
      return `${diffInSecs} ${diffInSecs === 1 ? 'second' : 'seconds'} ago`;
    } else if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      // If more than a month, show the date
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  const fetchAgentData = async () => {
    // Log each question with its assigned agent ID
    questions.forEach(q => {
      console.log("Question:", {
        id: q.questionId,
        title: q.questionTitle,
        status: q.status,
        assignedAgentId: q.assignedAgentId,
        hasAssignedAgentId: !!q.assignedAgentId,
        allProps: Object.keys(q).filter(k => k.includes('assign') || k.includes('user'))
      });
    });
    
    // Try getting questions with status PENDING and any agent ID
    const pendingQuestions = questions.filter(q => q.status === 'PENDING');
    console.log("PENDING QUESTIONS COUNT:", pendingQuestions.length);
    
    // Get all questions that have any agent ID field (regardless of name)
    const anyAgentQuestions = questions.filter(q => {
      // Try all possible property names
      return q.assignedAgentId || q.assigned_user_id || q.assignedUserId || q.agentId;
    });
    
    console.log("ANY AGENT QUESTIONS COUNT:", anyAgentQuestions.length);
    console.log("ANY AGENT QUESTIONS:", anyAgentQuestions);
    
    if (anyAgentQuestions.length === 0) {
      console.log("NO QUESTIONS WITH ANY AGENT ID FIELD");
      return;
    }
    
    // Try to extract agent IDs using various property names
    const possibleAgentIds = [];
    anyAgentQuestions.forEach(q => {
      const id = q.assignedAgentId || q.assigned_user_id || q.assignedUserId || q.agentId;
      if (id) possibleAgentIds.push(id);
    });
    
    const uniqueAgentIds = [...new Set(possibleAgentIds)];
    console.log("UNIQUE AGENT IDs TO FETCH:", uniqueAgentIds);
    
    if (uniqueAgentIds.length === 0) {
      console.log("NO AGENT IDs FOUND");
      return;
    }
    
    // Create a map to store agents
    const agentsMap = {};
    
    // Fetch agent data
    for (const agentId of uniqueAgentIds) {
      try {
        console.log(`FETCHING AGENT DATA FOR ID: ${agentId}`);
        const response = await usersApi.getById(agentId);
        
        if (response && response.data) {
          agentsMap[agentId] = response.data;
          console.log(`AGENT DATA FOR ID ${agentId}:`, response.data);
        }
      } catch (error) {
        console.error(`FAILED TO FETCH AGENT ${agentId}:`, error);
      }
    }
    
    console.log("FINAL AGENTS MAP:", agentsMap);
    setAssignedUsers(agentsMap);
  };

  // Call this after questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      fetchAgentData();
    }
  }, [questions]);

  useEffect(() => {
    // When questions load, fetch answers for all ANSWERED questions automatically
    if (questions.length > 0) {
      questions.forEach(question => {
        if (question.status === 'ANSWERED' && question.answerCount > 0) {
          fetchAnswersForQuestion(question.questionId);
        }
      });
    }
  }, [questions]);

  const isRecent = (dateString) => {
    if (!dateString) return false;
    
    const questionDate = new Date(dateString);
    const now = new Date();
    const hoursDiff = (now - questionDate) / (1000 * 60 * 60);
    
    return hoursDiff < 24; // Consider questions less than 24 hours old as "recent"
  };

  const toggleQuestionText = (questionId) => {
    const willBeExpanded = !expandedQuestions[questionId];
    
    // If we're expanding the question and we don't have answers yet, fetch them
    if (willBeExpanded && !questionAnswers[questionId]) {
      fetchAnswersForQuestion(questionId);
    }
    
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: willBeExpanded
    }));
  };

  const fetchAnswersForQuestion = async (questionId) => {
    try {
      const response = await answersApi.getAll();
      if (Array.isArray(response.data)) {
        const filteredAnswers = response.data.filter(
          (ans) => ans.questionId === parseInt(questionId, 10)
        );
        
        setQuestionAnswers(prev => ({
          ...prev,
          [questionId]: filteredAnswers
        }));
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    if (!answerText[questionId] || !answerText[questionId].trim()) {
      setSubmitStatus({
        ...submitStatus,
        [questionId]: { error: 'Answer cannot be empty', success: null }
      });
      return;
    }
    
    try {
      const payload = {
        answerText: answerText[questionId],
        questionId: parseInt(questionId, 10),
        userId: userId
      };
      
      const response = await answersApi.submit(payload);

      if (response.data) {
        setSubmitStatus({
          ...submitStatus,
          [questionId]: { error: null, success: 'Answer submitted successfully!' }
        });
        setAnswerText({
          ...answerText,
          [questionId]: ''
        });
        // Refresh questions to update answer count and status
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setSubmitStatus({
        ...submitStatus,
        [questionId]: { error: 'Failed to submit answer. Please try again.', success: null }
      });
    }
  };

  const handleDeleteAnswer = async (answerId, questionId) => {
    try {
      await answersApi.delete(answerId);
      // Update the answers for this question
      setQuestionAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId].filter(ans => ans.answerId !== answerId)
      }));
      // Show success message
      setSubmitStatus({
        ...submitStatus,
        [questionId]: { error: null, success: 'Answer deleted successfully!' }
      });
      // Refresh questions to update answer count
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting answer:', error);
      setSubmitStatus({
        ...submitStatus,
        [questionId]: { error: 'Failed to delete answer. Please try again.', success: null }
      });
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getQuestionStats = () => {
    const pendingForYou = questions.filter(q => 
      q.status === 'PENDING' && q.assignedAgentId === userId
    ).length;
    
    const pendingForOthers = questions.filter(q => 
      q.status === 'PENDING' && q.assignedAgentId !== userId && q.assignedAgentId
    ).length;
    
    const unansweredCount = questions.filter(q => 
      q.status === 'UNANSWERED'
    ).length;
    
    const answeredCount = questions.filter(q => 
      q.status === 'ANSWERED'
    ).length;
    
    return {
      pendingForYou,
      pendingForOthers,
      unansweredCount,
      answeredCount,
      totalCount: questions.length
    };
  };

  return (
    <div className={`agent-questions-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <SideNavbar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`agent-questions-content ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
        <div className="help-mode-toggle-container">
          <span className="help-mode-label">Help Mode</span>
          <button 
            className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
            onClick={() => setHelpModeEnabled(!helpModeEnabled)}
            data-tooltip="Toggle help tooltips on/off"
            data-tooltip-position="left"
          >
            <div className="help-mode-toggle-circle"></div>
            <span className="sr-only">Toggle help mode</span>
          </button>
        </div>

        <header className="page-header">
          <h1>My Assigned Questions</h1>
          <div className="filter-controls">
            <label htmlFor="status-filter">Filter by status:</label>
            <select 
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                // This will trigger a new API call via the useEffect
              }}
              className="status-filter"
            >
              <option value="">All Questions</option>
              <option value="PENDING">Pending</option>
              <option value="ANSWERED">Answered</option>
              <option value="UNANSWERED">Unanswered</option>
            </select>
            
            <div className="sort-control">
              <label>Sort order:</label>
              <button 
                className={`sort-button ${sortNewestFirst ? 'active' : ''}`}
                onClick={() => {
                  setSortNewestFirst(true);
                  // Re-sort the existing questions without making a new API call
                  setQuestions(prev => [...prev].sort((a, b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  }));
                }}
              >
                Newest First
              </button>
              <button 
                className={`sort-button ${!sortNewestFirst ? 'active' : ''}`}
                onClick={() => {
                  setSortNewestFirst(false);
                  // Re-sort the existing questions without making a new API call
                  setQuestions(prev => [...prev].sort((a, b) => {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                  }));
                }}
              >
                Oldest First
              </button>
            </div>
          </div>
        </header>

        <div className="stats-dashboard">
          <div className="stats-card pending-for-you">
            <div className="stats-icon">📝</div>
            <div className="stats-content">
              <h3>Pending For You</h3>
              <div className="stats-number">{getQuestionStats().pendingForYou}</div>
            </div>
          </div>
          
          <div className="stats-card unanswered">
            <div className="stats-icon">❓</div>
            <div className="stats-content">
              <h3>Unanswered</h3>
              <div className="stats-number">{getQuestionStats().unansweredCount}</div>
            </div>
          </div>
          
          <div className="stats-card pending-for-others">
            <div className="stats-icon">👥</div>
            <div className="stats-content">
              <h3>Pending For Others</h3>
              <div className="stats-number">{getQuestionStats().pendingForOthers}</div>
            </div>
          </div>
          
          <div className="stats-card total">
            <div className="stats-icon">📊</div>
            <div className="stats-content">
              <h3>Total Questions</h3>
              <div className="stats-number">{getQuestionStats().totalCount}</div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <p>Loading questions...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchQuestions} className="retry-button">
              Try Again
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-container">
            <span role="img" aria-label="All done" style={{fontSize: '3rem'}}>✅</span>
            <p>No questions found matching your criteria.</p>
            <p className="empty-subtext">You're all caught up!</p>
          </div>
        ) : (
          <div className="question-list">
            {questions.map((question) => {
              console.log(`Question ID ${question.questionId}:`, question);
              
              return (
                <div key={question.questionId} className={`question-card ${question.status.toLowerCase()}`}>
                  <div className="question-header">
                    <h2 className="question-title">
                      {question.questionTitle}
                      {isRecent(question.createdAt) && (
                        <span className="new-question-badge">New</span>
                      )}
                    </h2>
                    <div className="question-actions">
                      {question.status === 'UNANSWERED' && (
                        <button 
                          className="take-question-button"
                          onClick={() => handleTakeQuestion(question.questionId)}
                          title="Take ownership of this question"
                        >
                          <span role="img" aria-label="Take">✓</span> Take Question
                        </button>
                      )}
                      <span className={`question-status ${question.status.toLowerCase()}`}>
                        {question.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="question-text-container">
                    <div className="question-and-answer-layout">
                      <div className="question-section">
                        <p className={`question-text ${expandedQuestions[question.questionId] ? 'expanded' : 'collapsed'}`}>
                          {expandedQuestions[question.questionId] 
                            ? question.questionText  // Full text only when expanded
                            : truncateText(question.questionText, 100)  // Short preview when collapsed
                          }
                        </p>
                        <button 
                          className="toggle-text-button"
                          onClick={() => toggleQuestionText(question.questionId)}
                        >
                          {expandedQuestions[question.questionId] ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                      
                      {/* Answer section - only visible when expanded */}
                      {expandedQuestions[question.questionId] && (
                        <div className="answer-section">
                          {/* Display answers if there are any */}
                          {questionAnswers[question.questionId] && questionAnswers[question.questionId].length > 0 ? (
                            <>
                              <h3>Answers ({questionAnswers[question.questionId].length})</h3>
                              <div className="answer-preview-content">
                                <p>{questionAnswers[question.questionId][0].answerText}</p>
                                <div className="answer-preview-meta">
                                  <span>Answered by: {questionAnswers[question.questionId][0].userEmail || 'Agent'}</span>
                                </div>
                              </div>
                              {questionAnswers[question.questionId].length > 1 && (
                                <div className="more-answers-note">
                                  <span>+ {questionAnswers[question.questionId].length - 1} more answers</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <h3>No answers yet</h3>
                          )}
                          
                          {/* Restore the answer form */}
                          <div className="inline-answer-form">
                            <h3>Submit Your Answer</h3>
                            <TextArea
                              className="answer-input"
                              value={answerText[question.questionId] || ''}
                              onChange={(e) => setAnswerText({
                                ...answerText,
                                [question.questionId]: e.target.value
                              })}
                              placeholder="Type your answer here..."
                            />
                            {submitStatus[question.questionId]?.error && (
                              <p className="error-message">{submitStatus[question.questionId].error}</p>
                            )}
                            {submitStatus[question.questionId]?.success && (
                              <p className="success-message">{submitStatus[question.questionId].success}</p>
                            )}
                            <div className="answer-actions">
                              <button 
                                className="cancel-answer-button"
                                onClick={() => {
                                  setAnswerText({...answerText, [question.questionId]: ''});
                                  setSubmitStatus({...submitStatus, [question.questionId]: null});
                                }}
                              >
                                Cancel
                              </button>
                              <button 
                                className="submit-answer-button"
                                onClick={() => handleSubmitAnswer(question.questionId)}
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {question.status === 'PENDING' && (
                    <div className="assigned-agent-banner">
                      <div className="assigned-agent-icon">👤</div>
                      <div className="assigned-agent-details">
                        <span className="assigned-label">Currently assigned to:</span>
                        <span className="assigned-name">
                          {!question.assignedAgentId || question.assignedAgentId <= 0 ? (
                            <strong>Processing</strong>
                          ) : question.assignedAgentId === userId ? (
                            <strong>You</strong>
                          ) : (
                            <strong>
                              {assignedUsers[question.assignedAgentId] ? 
                                (assignedUsers[question.assignedAgentId].name || 
                                 assignedUsers[question.assignedAgentId].email || 
                                 `Agent #${question.assignedAgentId}`) :
                                `Agent #${question.assignedAgentId}`}
                            </strong>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="question-metadata-container">
                    <div className="question-metadata">
                      <div className="metadata-item project-info">
                        <span className="metadata-icon">📁</span>
                        <span className="metadata-label">Project:</span>
                        <span className="metadata-value">{question.projectName}</span>
                      </div>
                      <div className="metadata-item department-info">
                        <span className="metadata-icon">🏢</span>
                        <span className="metadata-label">Expertise:</span>
                        <span className="metadata-value">{question.departmentName}</span>
                      </div>
                      <div className="metadata-item date-info">
                        <span className="metadata-icon">📅</span>
                        <span className="metadata-label">Created:</span>
                        <span className="metadata-value">{formatDate(question.createdAt)}</span>
                      </div>
                      <div className="metadata-item answer-count">
                        <span className="metadata-icon">💬</span>
                        <span className="metadata-label">Answers:</span>
                        <span className="metadata-value">{question.answerCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentQuestionsPage; 