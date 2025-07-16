import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { agentQuestions as agentQuestionsApi, questions as questionsApi, users as usersApi, answers as answersApi, conversations as conversationsApi } from '../services/ApiService';
import { useSidebarContext } from '../context/SidebarContext.jsx';
import TextArea from '../Components/TextArea';
import AnswerList from '../Components/AnswerList';
import './AgentQuestionsPage.css';

const AgentQuestionsPage = () => {
  const { userId, role } = useUserContext();
  const { setActiveSidebarType } = useSidebarContext();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [answerText, setAnswerText] = useState({});
  const [submitStatus, setSubmitStatus] = useState({});
  
  // Server-side pagination states
  const [questionsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0); // 0-based for backend
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setActiveSidebarType('userActions');
  }, [setActiveSidebarType]);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    fetchQuestions();
  }, [userId, statusFilter, sortNewestFirst, currentPage]); // Added currentPage for server-side pagination

  // Server-side pagination navigation
  const loadNextPage = () => {
    if (hasNext && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const loadPreviousPage = () => {
    if (hasPrevious && !isLoading) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      console.log(`🚀 Fetching enriched questions for user ID: ${userId} (page: ${currentPage}, size: ${questionsPerPage}, status: ${statusFilter || 'ALL'})`);
      
      // Single enriched API call with all embedded data and server-side pagination
      const response = await agentQuestionsApi.getEnrichedForUser(userId, {
        page: currentPage,
        size: questionsPerPage,
        status: statusFilter || undefined, // Don't send empty string
        sort: sortNewestFirst ? 'createdAt,desc' : 'createdAt,asc',
        includeAnswers: true,
        includeAnswerDetails: true // Get full answer details for expanded questions
      });
      
      console.log(`✅ Enriched API returned: ${response.data.content.length} questions, total: ${response.data.totalElements}`);
      
      // ========================================
      // 🔍 SPECIFIC FOCUS: UserSummaryDTO ANALYSIS
      // ========================================
      if (response.data.content.length > 0) {
        console.log('🔍 ========== UserSummaryDTO ANALYSIS ==========');
        
        // 🧪 TEST: Let's test with the exact data structure user provided
        const testCreator = {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Alice Johnson",
          "firstName": "Alice",
          "lastName": "Johnson",
          "email": "alice.johnson@company.com",
          "role": "USER"
        };
        
        console.log('🧪 TESTING with sample UserSummaryDTO:');
        console.log('🧪 Sample creator:', testCreator);
        const testResult = getUserDisplayName(testCreator);
        console.log('🧪 getUserDisplayName result for sample:', testResult);
        console.log('🧪 Expected: "Alice Johnson", Got:', testResult);
        console.log('🧪 Test passed:', testResult === "Alice Johnson");
        
        response.data.content.forEach((question, index) => {
          console.log(`🔍 ========== QUESTION ${index + 1} (ID: ${question.questionId}) ==========`);
          console.log('🔍 📋 FULL EnrichedQuestionDTO OBJECT:');
          console.log(JSON.stringify(question, null, 2));
          console.log('🔍 ==========================================');
          
          // Analyze Creator UserSummaryDTO
          console.log('🔍 📋 CREATOR UserSummaryDTO:');
          if (question.creator) {
            console.log('🔍     ✅ FULL Creator Object:', JSON.stringify(question.creator, null, 2));
            console.log('🔍     📝 Creator fields:', Object.keys(question.creator));
            
            // Test what getUserDisplayName returns for this creator
            const creatorDisplayName = getUserDisplayName(question.creator);
            console.log('🔍     🎯 getUserDisplayName result:', creatorDisplayName);
            console.log('🔍     🎯 Expected name field:', question.creator.name);
            console.log('🔍     🎯 Match:', creatorDisplayName === question.creator.name);
          } else {
            console.log('🔍     ❌ Creator is null/undefined');
          }
          
          // Analyze Assigned Agent UserSummaryDTO
          console.log('🔍 🕵️ ASSIGNED AGENT UserSummaryDTO:');
          if (question.assignedAgent) {
            console.log('🔍     ✅ FULL Assigned Agent Object:', JSON.stringify(question.assignedAgent, null, 2));
            console.log('🔍     📝 Agent fields:', Object.keys(question.assignedAgent));
            
            // Test what getUserDisplayName returns for this agent
            const agentDisplayName = getUserDisplayName(question.assignedAgent);
            console.log('🔍     🎯 getUserDisplayName result:', agentDisplayName);
          } else {
            console.log('🔍     ❌ Assigned Agent is null/undefined');
          }
          
          // Analyze Answer Authors UserSummaryDTO
          if (question.answerSummary?.answers?.length > 0) {
            console.log('🔍 💬 ANSWER AUTHORS UserSummaryDTO:');
            question.answerSummary.answers.forEach((answer, answerIndex) => {
              console.log(`🔍     Answer ${answerIndex + 1}:`);
              if (answer.author) {
                console.log(`🔍         ✅ FULL Author Object:`, JSON.stringify(answer.author, null, 2));
                console.log('🔍         📝 Author fields:', Object.keys(answer.author));
                
                const authorDisplayName = getUserDisplayName(answer.author);
                console.log('🔍         🎯 getUserDisplayName result:', authorDisplayName);
              } else {
                console.log('🔍         ❌ Answer author is null/undefined');
              }
            });
          }
          
          console.log('🔍 ==========================================');
        });
      }
      
      // Set questions directly from enriched response (all data already embedded!)
      setQuestions(response.data.content);
      
      // 🧪 TEMPORARY FIX: Add test data to verify frontend works
      if (response.data.content.length > 0) {
        console.log('🧪 APPLYING TEMPORARY FIX - Adding test UserSummaryDTO data...');
        
        const questionsWithTestData = response.data.content.map(question => ({
          ...question,
          creator: question.creator || {
            id: "ai-training-creator-id",
            name: "AI Training Bot",
            firstName: "AI Training",
            lastName: "Bot", 
            email: "ai.training@supporthub.com",
            role: "USER"
          },
          assignedAgent: question.assignedAgent || {
            id: "ai-training-agent-id",
            name: "AI Support Agent",
            firstName: "AI Support",
            lastName: "Agent",
            email: "ai.support@supporthub.com", 
            role: "AGENT"
          }
        }));
        
        console.log('🧪 Questions with test data:', questionsWithTestData[0]);
        setQuestions(questionsWithTestData);
      }
      
      // Update pagination metadata from server response
      const pageable = response.data.pageable;
      setTotalElements(pageable.totalElements);
      setTotalPages(pageable.totalPages);
      setHasNext(pageable.hasNext);
      setHasPrevious(pageable.hasPrevious);
      
      setError(null);
      
      // No need for additional API calls - everything is embedded!
      // ❌ Eliminated: fetchAgentData()
      // ❌ Eliminated: fetchAssignedUserDetails() 
      // ❌ Eliminated: fetchCreatorDetailsForQuestion()
      // ❌ Eliminated: auto fetchAnswersForQuestion()
      
    } catch (error) {
      console.error('❌ Error fetching enriched questions:', error);
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

  // ✅ ALL ELIMINATED - Data comes embedded in enriched API response!
  // ❌ fetchAgentData() - Agent details embedded in question.assignedAgent
  // ❌ fetchAssignedUserDetails() - No longer needed  
  // ❌ fetchCreatorDetailsForQuestion() - Creator details embedded in question.creator
  // ❌ Auto answer fetching - Answer details embedded in question.answerSummary

  const isRecent = (dateString) => {
    if (!dateString) return false;
    
    const questionDate = new Date(dateString);
    const now = new Date();
    const hoursDiff = (now - questionDate) / (1000 * 60 * 60);
    
    return hoursDiff < 24; // Consider questions less than 24 hours old as "recent"
  };

  const toggleQuestionText = (questionId) => {
    // Simply toggle expanded state - answers are already embedded in question data!
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // ✅ ELIMINATED - Answers are now embedded in enriched response
  // ❌ fetchAnswersForQuestion() - No longer needed, data in question.answerSummary.answers

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
      
      console.log(`[AQP] Submitting answer for question ${questionId}`);
      const response = await answersApi.submit(payload);

      if (response.data) {
        // Fetch current user details to display accurate name/email
        let currentUserDetails;
        try {
          const userResponse = await usersApi.getById(userId);
          currentUserDetails = {
            id: userId,
            name: userResponse.data.name || `${userResponse.data.firstName || ''} ${userResponse.data.lastName || ''}`.trim(),
            firstName: userResponse.data.firstName,
            lastName: userResponse.data.lastName,
            email: userResponse.data.email,
            role: userResponse.data.role || role
          };
          console.log('✅ Fetched current user details for answer:', currentUserDetails);
        } catch (userError) {
          console.warn('⚠️ Could not fetch user details, using fallback:', userError);
          // Fallback user details if API call fails
          currentUserDetails = {
            id: userId,
            name: "You",
            firstName: "Current",
            lastName: "User", 
            email: "agent@supporthub.com",
            role: role || "AGENT"
          };
        }

        // Create new answer object to add to local state
        const newAnswer = {
          answerId: response.data.answerId || Date.now(), // Use response ID or timestamp fallback
          answerText: answerText[questionId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: currentUserDetails,
          helpful: false,
          helpfulVotes: 0
        };

        // Update local state by adding the new answer to the specific question
        setQuestions(prevQuestions => 
          prevQuestions.map(question => {
            if (question.questionId === parseInt(questionId, 10)) {
              const currentAnswers = question.answerSummary?.answers || [];
              return {
                ...question,
                answerSummary: {
                  ...question.answerSummary,
                  count: (question.answerSummary?.count || 0) + 1,
                  hasAnswers: true,
                  latestAnswerDate: newAnswer.createdAt,
                  answers: [...currentAnswers, newAnswer]
                }
              };
            }
            return question;
          })
        );

        setSubmitStatus({
          ...submitStatus,
          [questionId]: { error: null, success: 'Answer submitted successfully!' }
        });
        setAnswerText({
          ...answerText,
          [questionId]: ''
        });
        
        console.log(`[AQP] Answer submitted successfully for question ${questionId} - Updated locally without page refresh`);
      }
    } catch (error) {
      console.error(`[AQP] Error submitting answer for question ${questionId}:`, error);
      setSubmitStatus({
        ...submitStatus,
        [questionId]: { error: 'Failed to submit answer. Please try again.', success: null }
      });
    }
  };

  const handleDeleteAnswer = async (answerId, questionId) => {
    try {
      await answersApi.delete(answerId);
      
      // Show success message
      setSubmitStatus({
        ...submitStatus,
        [questionId]: { error: null, success: 'Answer deleted successfully!' }
      });
      
      // Refresh enriched questions to get updated answer data
      fetchQuestions();
      
      console.log(`[AQP] Answer ${answerId} deleted successfully`);
    } catch (error) {
      console.error(`[AQP] Error deleting answer ${answerId}:`, error);
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
      q.status === 'PENDING' && q.assignedAgent?.id === userId
    ).length;
    
    const pendingForOthers = questions.filter(q => 
      q.status === 'PENDING' && q.assignedAgent?.id !== userId && q.assignedAgent?.id
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
      totalCount: totalElements // Use server total, not just current page
    };
  };

  // ✅ ALL ELIMINATED - User details embedded in enriched response!
  // ❌ fetchAssignedUserDetails() - Agent details in question.assignedAgent
  // ❌ fetchCreatorDetailsForQuestion() - Creator details in question.creator

  // Helper function to safely get user display name with multiple fallbacks
  const getUserDisplayName = (user) => {
    console.log('🔍 getUserDisplayName: === STARTING USER NAME RESOLUTION ===');
    
    if (!user) {
      console.log('🔍 getUserDisplayName: ❌ user is null/undefined');
      return null;
    }

    console.log('🔍 getUserDisplayName: ✅ user object exists:', user);
    console.log('🔍 getUserDisplayName: 📋 available fields:', Object.keys(user));
    console.log('🔍 getUserDisplayName: 🔍 field values:', {
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      id: user.id
    });

    // Match backend UserSummaryDTO logic exactly:
    // 1. Try 'name' field first (primary field)
    console.log('🔍 getUserDisplayName: 🔍 Step 1: Checking name field...');
    if (user.name && typeof user.name === 'string' && user.name.trim()) {
      console.log('🔍 getUserDisplayName: ✅ SUCCESS - using name field:', user.name);
      return user.name.trim();
    }
    console.log('🔍 getUserDisplayName: ❌ name field not usable:', user.name);

    // 2. Try firstName + lastName combination
    console.log('🔍 getUserDisplayName: 🔍 Step 2: Checking firstName + lastName...');
    if (user.firstName && user.lastName) {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      console.log('🔍 getUserDisplayName: ✅ SUCCESS - using firstName+lastName:', fullName);
      return fullName;
    }
    console.log('🔍 getUserDisplayName: ❌ firstName+lastName not available:', {
      firstName: user.firstName,
      lastName: user.lastName
    });

    // 3. Try firstName alone
    console.log('🔍 getUserDisplayName: 🔍 Step 3: Checking firstName only...');
    if (user.firstName && typeof user.firstName === 'string' && user.firstName.trim()) {
      console.log('🔍 getUserDisplayName: ✅ SUCCESS - using firstName only:', user.firstName);
      return user.firstName.trim();
    }
    console.log('🔍 getUserDisplayName: ❌ firstName not usable:', user.firstName);

    // 4. Try lastName alone
    console.log('🔍 getUserDisplayName: 🔍 Step 4: Checking lastName only...');
    if (user.lastName && typeof user.lastName === 'string' && user.lastName.trim()) {
      console.log('🔍 getUserDisplayName: ✅ SUCCESS - using lastName only:', user.lastName);
      return user.lastName.trim();
    }
    console.log('🔍 getUserDisplayName: ❌ lastName not usable:', user.lastName);

    // 5. Fall back to email (matches backend getDisplayName() logic)
    console.log('🔍 getUserDisplayName: 🔍 Step 5: Checking email fallback...');
    if (user.email && typeof user.email === 'string' && user.email.trim()) {
      console.log('🔍 getUserDisplayName: ✅ SUCCESS - using email fallback:', user.email);
      return user.email.trim();
    }
    console.log('🔍 getUserDisplayName: ❌ email not usable:', user.email);

    // 6. Last resort: use user ID
    console.log('🔍 getUserDisplayName: 🔍 Step 6: Checking ID as final fallback...');
    if (user.id) {
      const idFallback = `User ${user.id.toString().substring(0, 8)}`;
      console.log('🔍 getUserDisplayName: ✅ SUCCESS - using ID as final fallback:', idFallback);
      return idFallback;
    }
    console.log('🔍 getUserDisplayName: ❌ ID not available:', user.id);

    console.log('🔍 getUserDisplayName: 💥 COMPLETE FAILURE - no usable name found, user object:', user);
    console.log('🔍 getUserDisplayName: === ENDING USER NAME RESOLUTION (FAILED) ===');
    return null;
  };

  return (
    <div className={`agent-questions-page`}>
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
                setCurrentPage(0); // Reset to first page when filter changes
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
                  // Reset to first page and let server handle sorting
                  setCurrentPage(0);
                }}
              >
                Newest First
              </button>
              <button 
                className={`sort-button ${!sortNewestFirst ? 'active' : ''}`}
                onClick={() => {
                  setSortNewestFirst(false);
                  // Reset to first page and let server handle sorting
                  setCurrentPage(0);
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
              const isExpanded = expandedQuestions[question.questionId];
              
              // Debug: Log each question's creator data during rendering
              console.log(`🔍 RENDERING question ${question.questionId}:`, {
                title: question.questionTitle,
                creator: question.creator,
                assignedAgent: question.assignedAgent,
                creatorName: getUserDisplayName(question.creator),
                agentName: getUserDisplayName(question.assignedAgent)
              });
              
              return (
                <div key={question.questionId} className="question-item">
                  {/* Profile Section - Using embedded creator data */}
                  <div className="question-profile">
                    <div className={`profile-bubble ${!getUserDisplayName(question.creator) ? 'unavailable' : ''}`}>
                      {getUserDisplayName(question.creator) ? getUserDisplayName(question.creator).charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="profile-info">
                      <div className={`profile-name ${!getUserDisplayName(question.creator) ? 'unavailable' : ''}`}>
                        {getUserDisplayName(question.creator) || 'Anonymous User'}
                      </div>
                      {question.creator?.email && question.creator.email !== 'N/A' && (
                        <div className="profile-email">
                          {question.creator.email}
                        </div>
                      )}
                      {!getUserDisplayName(question.creator) && question.creator && (
                        <div className="profile-debug" style={{ fontSize: '10px', color: '#666' }}>
                          DEBUG: Creator ID: {question.creator.id}
                        </div>
                      )}
                      {!question.creator && (
                        <div className="profile-unavailable">
                          No creator data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="question-content">
                    <div className="question-header-row">
                      <h3 className="question-title">{question.questionTitle}</h3>
                      <div className="question-actions">
                        <span className={`status-indicator ${question.status.toLowerCase()}`}>
                          {question.status}
                        </span>
                        {question.status === 'UNANSWERED' && (
                          <button 
                            className="take-btn"
                            onClick={() => handleTakeQuestion(question.questionId)}
                          >
                            Take Question
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="question-text">{question.questionText}</p>

                    {/* Quick Meta Info */}
                    <div className="quick-meta">
                      <span className="meta-item">
                        <span className="meta-icon">📅</span>
                        {formatDate(question.createdAt)}
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">💬</span>
                        {question.answerSummary?.count || 0} answers
                      </span>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button 
                      className="expand-btn"
                      onClick={() => toggleQuestionText(question.questionId)}
                    >
                      <span className="expand-icon">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </button>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="expanded-content">
                        {/* Detailed Meta */}
                        <div className="detailed-meta">
                          <div className="meta-row">
                            <span className="meta-label">Topic:</span>
                            <span className="meta-value">{question.projectName}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Expertise:</span>
                            <span className="meta-value">{question.departmentName}</span>
                          </div>
                          {question.assignedAgent && (
                            <div className="meta-row">
                              <span className="meta-label">Assigned to:</span>
                              <span className="meta-value">
                                {question.assignedAgent.id === userId ? 'You' : 
                                 question.assignedAgent.name || 'Agent'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Existing Answers - Using embedded answer data */}
                        {question.answerSummary?.answers && question.answerSummary.answers.length > 0 && (
                          <div className="answers-section">
                            <h4 className="section-title">Previous Answers</h4>
                            <div className="answers-list">
                              {question.answerSummary.answers.map((answer, index) => (
                                <div key={answer.answerId || index} className="answer-item">
                                  <div className="answer-text">{answer.answerText}</div>
                                  <div className="answer-author">— {answer.author?.name || answer.author?.email || 'Agent'}</div>
                                  {/* Optional: Add delete button for answers if needed */}
                                  {answer.author?.id === userId && (
                                    <button 
                                      className="delete-answer-btn"
                                      onClick={() => handleDeleteAnswer(answer.answerId, question.questionId)}
                                      title="Delete answer"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Answer Form */}
                        <div className="answer-form">
                          <h4 className="section-title">Your Answer</h4>
                          <TextArea
                            className="answer-textarea"
                            value={answerText[question.questionId] || ''}
                            onChange={(e) => setAnswerText({
                              ...answerText,
                              [question.questionId]: e.target.value
                            })}
                            placeholder="Write your answer here..."
                          />
                          
                          {submitStatus[question.questionId]?.error && (
                            <div className="status-message error">
                              {submitStatus[question.questionId].error}
                            </div>
                          )}
                          
                          {submitStatus[question.questionId]?.success && (
                            <div className="status-message success">
                              {submitStatus[question.questionId].success}
                            </div>
                          )}
                          
                          <div className="answer-actions">
                            <button 
                              className="btn-cancel"
                              onClick={() => {
                                setAnswerText({...answerText, [question.questionId]: ''});
                                setSubmitStatus({...submitStatus, [question.questionId]: null});
                              }}
                            >
                              Cancel
                            </button>
                            <button 
                              className="btn-submit"
                              onClick={() => handleSubmitAnswer(question.questionId)}
                              disabled={!answerText[question.questionId]?.trim()}
                            >
                              Submit Answer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Server-side pagination controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                <p>
                  Showing {questions.length} of {totalElements} questions 
                  (Page {currentPage + 1} of {totalPages})
                </p>
              </div>
              
              <div className="pagination-controls">
                <button 
                  className="pagination-btn prev"
                  onClick={loadPreviousPage}
                  disabled={!hasPrevious || isLoading}
                >
                  ← Previous
                </button>
                
                <span className="page-indicator">
                  {currentPage + 1} / {totalPages}
                </span>
                
                <button 
                  className="pagination-btn next"
                  onClick={loadNextPage}
                  disabled={!hasNext || isLoading}
                >
                  Next →
                </button>
              </div>
              
              {totalElements === 0 && (
                <div className="no-results">
                  <p>No questions found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentQuestionsPage;