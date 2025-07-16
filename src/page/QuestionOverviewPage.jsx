// QuestionOverviewPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import './QuestionOverviewPage.css';
import SearchBar from '../Components/Searchbar';
import TextArea from '../Components/TextArea';
import TextInput from '../Components/TextInput';
import { questions as questionsApi, users as usersApi, answers as answersApi, setAuthToken } from '../services/ApiService';
import Tooltip from '../Components/Tooltip';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { useUserContext } from '../context/LoginContext';
import QAReplacementModal from '../Components/QAReplacementModal';

const QuestionOverviewPage = ({
  isModalMode = false,
  modalProjectId,
  modalProjectName,
  modalDepartmentName,
  modalBusinessName,
  onCloseModal
}) => {
  const [questionText, setQuestionText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const params = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [questionCreators, setQuestionCreators] = useState({});
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [fetchedAnswers, setFetchedAnswers] = useState(new Set()); // Track which questions have had answers fetched
  
  // Pagination states
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [questionsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchingAnswerCounts, setFetchingAnswerCounts] = useState(new Set());

  // Export functionality
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Q&A Replacement Modal state
  const [showQAModal, setShowQAModal] = useState(false);

  // Determine context based on mode
  const currentProjectId = isModalMode ? modalProjectId : params.projectId;
  const currentProjectName = isModalMode ? modalProjectName : params.project;
  const currentDepartmentName = isModalMode ? modalDepartmentName : params.department;
  const currentBusinessName = isModalMode ? modalBusinessName : params.businessName;
  
  const { hasProjectPermission } = useUserPermissions();
  const hasPermission = hasProjectPermission(currentProjectId);
  const { role } = useUserContext();

  const decodedProject = decodeURIComponent(currentProjectName || '');
  const decodedDepartment = decodeURIComponent(currentDepartmentName || '');
  const decodedBusinessName = decodeURIComponent(currentBusinessName || '');

  console.log(`[QOP ${currentProjectId || 'Page'}] Rendering. ModalMode: ${isModalMode}`, {
    currentProjectId,
    currentProjectName,
    currentDepartmentName,
    currentBusinessName,
    props: { isModalMode, modalProjectId, modalProjectName, modalDepartmentName, modalBusinessName, onCloseModal }
  });

  // Fetch all questions (without answer counts for faster loading)
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError('');
      console.log(`[QOP ${currentProjectId}] Fetching questions.`);
      try {
        const response = await questionsApi.getByProjectId(currentProjectId);
        console.log(`[QOP ${currentProjectId}] Fetched questions response:`, response.data);
        
        const questionsData = response.data || [];
        
        // Set questions with default answerCount if not provided
        const questionsWithDefaults = questionsData.map(question => ({
          ...question,
          answerCount: question.answerCount !== undefined ? question.answerCount : null // null means not fetched yet
        }));
        
        setQuestions(questionsWithDefaults);
        setCurrentPage(1); // Reset pagination
      } catch (error) {
        console.error(`[QOP ${currentProjectId}] Error fetching questions:`, error);
        setError('Failed to fetch questions. Please try again later.');
      } finally {
        setIsLoading(false);
        console.log(`[QOP ${currentProjectId}] Finished fetching questions. Loading: false`);
      }
    };

    if (currentProjectId) {
      fetchQuestions();
    }
  }, [currentProjectId]);

  // Set up Fuse.js with options
  const fuse = useMemo(() => {
    const options = {
      keys: ['questionTitle', 'questionText'],
      threshold: 0.3,
      includeScore: true,
    };
    return new Fuse(questions, options);
  }, [questions]);

  // Use Fuse.js to get filtered questions
  const filteredQuestions = useMemo(() => {
    if (!searchTerm) {
      return questions;
    } else {
      const results = fuse.search(searchTerm);
      return results.map(result => result.item);
    }
  }, [fuse, searchTerm, questions]);

  // Update displayed questions when questions or pagination changes
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * questionsPerPage;
    const newDisplayedQuestions = filteredQuestions.slice(startIndex, endIndex);
    setDisplayedQuestions(newDisplayedQuestions);
  }, [filteredQuestions, currentPage, questionsPerPage]);

  // Fetch answer counts for displayed questions with rate limiting
  useEffect(() => {
    const fetchAnswerCountsForDisplayed = async () => {
      const questionsNeedingCounts = displayedQuestions.filter(question => 
        question.answerCount === null && !fetchingAnswerCounts.has(question.questionId)
      );

      if (questionsNeedingCounts.length === 0) return;

      // Mark questions as being fetched
      setFetchingAnswerCounts(prev => {
        const newSet = new Set(prev);
        questionsNeedingCounts.forEach(q => newSet.add(q.questionId));
        return newSet;
      });

      console.log(`[QOP ${currentProjectId}] Fetching answer counts for ${questionsNeedingCounts.length} questions`);

      // Process questions in smaller batches to avoid overwhelming the server
      const batchSize = 3;
      const batches = [];
      for (let i = 0; i < questionsNeedingCounts.length; i += batchSize) {
        batches.push(questionsNeedingCounts.slice(i, i + batchSize));
      }

      const allUpdates = [];

      // Process batches sequentially with a small delay
      for (const [batchIndex, batch] of batches.entries()) {
        if (batchIndex > 0) {
          // Add delay between batches to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const batchUpdates = await Promise.allSettled(
          batch.map(async (question) => {
            try {
              const answersResponse = await answersApi.getAnswersForQuestion(question.questionId);
              const answerCount = Array.isArray(answersResponse.data) ? answersResponse.data.length : 0;
              
              return {
                questionId: question.questionId,
                answerCount: answerCount,
                success: true
              };
            } catch (error) {
              // Reduce console noise - only log non-server errors
              if (error.response?.status < 500) {
                console.warn(`[QOP ${currentProjectId}] Failed to fetch answer count for question ${question.questionId}:`, error.message);
              }
              return {
                questionId: question.questionId,
                answerCount: 0,
                success: false,
                error: error.message
              };
            }
          })
        );

        allUpdates.push(...batchUpdates);
      }

      // Update questions with fetched answer counts and remove from fetching set
      const successfulUpdates = allUpdates
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      // Always remove all processed questions from fetching set first
      setFetchingAnswerCounts(prev => {
        const newSet = new Set(prev);
        questionsNeedingCounts.forEach(q => newSet.delete(q.questionId));
        return newSet;
      });

      if (successfulUpdates.length > 0) {
        setQuestions(prevQuestions => 
          prevQuestions.map(question => {
            const update = successfulUpdates.find(u => u.questionId === question.questionId);
            return update ? { ...question, answerCount: update.answerCount } : question;
          })
        );

        const successCount = successfulUpdates.filter(u => u.success).length;
        const errorCount = successfulUpdates.length - successCount;
        
        if (errorCount > 0) {
          console.log(`[QOP ${currentProjectId}] Answer count fetching completed: ${successCount} successful, ${errorCount} failed`);
        }
      }
    };

    if (displayedQuestions.length > 0) {
      fetchAnswerCountsForDisplayed();
    }
  }, [displayedQuestions, currentProjectId]);

  // Infinite scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || displayedQuestions.length >= filteredQuestions.length) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Load more when user scrolls to 80% of the page
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMoreQuestions();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, displayedQuestions.length, filteredQuestions.length]);

  const loadMoreQuestions = () => {
    if (isLoadingMore || displayedQuestions.length >= filteredQuestions.length) return;

    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    if (isModalMode) {
      // Reset form fields and search term when the project context changes in modal mode,
      // or when the modal is first opened for a project.
      console.log(`[QOP Modal ${modalProjectId}] Project ID changed to ${modalProjectId} or modal opened. Resetting form/search state.`);
      setTitle('');
      setQuestionText('');
      setSearchTerm('');
      setExpandedQuestions({});
      setQuestionCreators({});
      setQuestionAnswers({});
      setFetchedAnswers(new Set()); // Clear fetched answers tracking
      
      // Reset pagination
      setCurrentPage(1);
      setDisplayedQuestions([]);
      setFetchingAnswerCounts(new Set());
    }
  }, [isModalMode, modalProjectId]);

  // Load answers for displayed questions that have answer counts
  useEffect(() => {
    if (displayedQuestions.length > 0) {
      const questionsNeedingAnswers = displayedQuestions.filter(question => {
        const hasAnswerCount = typeof question.answerCount === 'number' && question.answerCount > 0;
        const notFetched = !fetchedAnswers.has(question.questionId);
        return hasAnswerCount && notFetched;
      });

      if (questionsNeedingAnswers.length > 0) {
        console.log(`[QOP ${currentProjectId}] Loading answers for ${questionsNeedingAnswers.length} displayed questions`);
        
        // Fetch answers with staggered timing to avoid overwhelming server
        questionsNeedingAnswers.forEach((question, index) => {
          setTimeout(() => {
            fetchAnswersForQuestion(question.questionId);
          }, index * 200); // 200ms delay between each fetch
        });
      }
    }
  }, [displayedQuestions, currentProjectId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(`[QOP ${currentProjectId}] handleSubmit called. Title: ${title}, Text: ${questionText}`);
    if (title && questionText && currentProjectId) {
      try {
        const response = await questionsApi.create({
          questionTitle: title,
          questionText: questionText,
          projectId: currentProjectId,
          status: 'Open'
        });
        console.log(`[QOP ${currentProjectId}] Question created:`, response.data);
        const newQuestion = {
          questionId: response.data.questionId,
          questionTitle: response.data.questionTitle,
          questionText: response.data.questionText,
          status: response.data.status,
          projectId: response.data.projectId,
          createdAt: response.data.createdAt,
          answerCount: 0,
          assignedAgentId: response.data.assignedAgentId
        };
        setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
        setTitle('');
        setQuestionText('');
        setError('');
      } catch (error) {
        console.error(`[QOP ${currentProjectId}] Error creating question:`, error);
        setError('Failed to submit question. Please try again.');
      }
    } else {
      console.warn(`[QOP ${currentProjectId}] handleSubmit - validation failed. Title: ${title}, Text: ${questionText}, ProjectID: ${currentProjectId}`);
      setError('Please fill in all fields.');
    }
  };

  const handleDelete = async (questionId) => {
    console.log(`[QOP ${currentProjectId}] handleDelete called for questionId: ${questionId}`);
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await questionsApi.delete(questionId);
        setQuestions(prevQuestions => prevQuestions.filter(q => q.questionId !== questionId));
        console.log(`[QOP ${currentProjectId}] Question ${questionId} deleted successfully.`);
      } catch (error) {
        console.error(`[QOP ${currentProjectId}] Error deleting question ${questionId}:`, error);
        setError('Failed to delete question. Please try again.');
      }
    }
  };

  const toggleQuestionDetails = (questionId) => {
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
    console.log(`[QOP ${currentProjectId}] Fetching answers for question ${questionId}`);
    
    // Mark this question as being fetched to prevent duplicates
    setFetchedAnswers(prev => new Set(prev).add(questionId));
    
    // Set loading state for this specific question
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] || [], // Keep existing answers while loading
      [`${questionId}_loading`]: true
    }));

    try {
      // Use the optimized method with caching
      const response = await answersApi.getAnswersForQuestion(questionId);
      
      if (Array.isArray(response.data)) {
        setQuestionAnswers(prev => ({
          ...prev,
          [questionId]: response.data,
          [`${questionId}_loading`]: false
        }));
        
        // Don't update questions state here - this was causing the infinite loop
        console.log(`[QOP ${currentProjectId}] Successfully fetched ${response.data.length} answers for question ${questionId}`);
      }
    } catch (error) {
      console.error(`[QOP ${currentProjectId}] Error fetching answers for question ${questionId}:`, error);
      setQuestionAnswers(prev => ({
        ...prev,
        [`${questionId}_loading`]: false,
        [`${questionId}_error`]: 'Failed to load answers'
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to handle answer deletion with counter update
  const handleAnswerDelete = async (answerId, questionId) => {
    if (!window.confirm('Are you sure you want to delete this answer?')) return;
    
    try {
      await answersApi.delete(answerId);
      
      // Invalidate cache for this question
      answersApi.invalidateQuestionCache(questionId);
      
      // Update local state - this will automatically update the count via getAnswerCount()
      const updatedAnswers = questionAnswers[questionId].filter(ans => ans.answerId !== answerId);
      setQuestionAnswers(prev => ({
        ...prev,
        [questionId]: updatedAnswers
      }));
      
      // Don't update questions state here - let getAnswerCount() handle the display
      console.log(`[QOP ${currentProjectId}] Answer ${answerId} deleted successfully`);
    } catch (error) {
      console.error(`[QOP ${currentProjectId}] Error deleting answer:`, error);
      setError('Failed to delete answer. Please try again.');
    }
  };

  // Helper function to get answer loading state
  const isAnswerLoading = (questionId) => {
    return questionAnswers[`${questionId}_loading`] || false;
  };

  // Helper function to get answer error state
  const getAnswerError = (questionId) => {
    return questionAnswers[`${questionId}_error`] || null;
  };

  // Export function
  const handleDownloadCSV = async () => {
    if (!questions || questions.length === 0) {
      setExportMessage('📄 No questions available to export.');
      return;
    }

    setIsExporting(true);
    setExportMessage('📄 Preparing export with answers...');

    try {
      // Fetch answers for all questions that don't have them loaded yet
      const questionsWithAnswers = await Promise.all(
        questions.map(async (question) => {
          let answers = questionAnswers[question.questionId];
          
          // If answers aren't loaded, fetch them
          if (!answers && !fetchedAnswers.has(question.questionId)) {
            try {
              const answersResponse = await answersApi.getAnswersForQuestion(question.questionId);
              answers = Array.isArray(answersResponse.data) ? answersResponse.data : [];
            } catch (error) {
              console.warn(`Failed to fetch answers for question ${question.questionId}:`, error);
              answers = [];
            }
          } else if (!answers) {
            answers = [];
          }
          
          return { ...question, answers };
        })
      );

      // Create CSV with questions and their answers
      const csvHeaders = [
        'Question ID', 
        'Title', 
        'Question Text', 
        'Status', 
        'Created Date', 
        'Answer Count',
        'Answers',
        'Answer Authors',
        'Answer Dates'
      ];
      
      const csvRows = questionsWithAnswers.map(question => {
        const answers = question.answers || [];
        const answerTexts = answers.map(answer => (answer.answerText || '').replace(/"/g, '""').replace(/\n/g, ' ')).join(' | ');
        const answerAuthors = answers.map(answer => answer.userEmail || 'Unknown').join(' | ');
        const answerDates = answers.map(answer => 
          answer.createdAt ? new Date(answer.createdAt).toLocaleDateString() : 'Unknown'
        ).join(' | ');
        
        return [
          question.questionId,
          `"${(question.questionTitle || '').replace(/"/g, '""')}"`,
          `"${(question.questionText || '').replace(/"/g, '""')}"`,
          question.status || 'Unknown',
          question.createdAt ? new Date(question.createdAt).toLocaleDateString() : 'Unknown',
          answers.length,
          `"${answerTexts}"`,
          `"${answerAuthors}"`,
          `"${answerDates}"`
        ];
      });

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `questions_with_answers_${currentProjectName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        const totalAnswers = questionsWithAnswers.reduce((sum, q) => sum + (q.answers?.length || 0), 0);
        setExportMessage(`📄 CSV downloaded: ${questions.length} questions with ${totalAnswers} answers exported`);
        setTimeout(() => setExportMessage(''), 5000);
      }
    } catch (error) {
      console.error('CSV export failed:', error);
      setExportMessage('❌ Download failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to get the actual answer count
  const getAnswerCount = (question) => {
    // First check if we have loaded answers (most reliable)
    const loadedAnswers = questionAnswers[question.questionId];
    if (Array.isArray(loadedAnswers)) {
      return loadedAnswers.length;
    }
    
    // Then check if we have a backend-provided answer count (including 0)
    if (typeof question.answerCount === 'number') {
      return question.answerCount;
    }
    
    // If we're currently fetching the count, show a loading indicator
    if (fetchingAnswerCounts.has(question.questionId)) {
      return '...';
    }
    
    // Final fallback to 0 if no data available
    return 0;
  };

  // Q&A Replacement Modal handlers
  const openQAModal = () => {
    console.log('[QuestionOverviewPage] Opening Q&A Modal - button clicked');
    console.log('[QuestionOverviewPage] Current showQAModal state:', showQAModal);
    console.log('[QuestionOverviewPage] Current project:', { currentProjectId, decodedProject });
    setShowQAModal(true);
    console.log('[QuestionOverviewPage] Q&A Modal state set to true');
  };

  const closeQAModal = () => {
    setShowQAModal(false);
  };

  const handleQAReplacementSuccess = (result) => {
    console.log('[QuestionOverviewPage] Q&A Replacement successful:', result);
    // Refresh questions after successful replacement
    if (currentProjectId) {
      const fetchQuestions = async () => {
        setIsLoading(true);
        try {
          const response = await questionsApi.getByProjectId(currentProjectId);
          const questionsData = response.data || [];
          const questionsWithDefaults = questionsData.map(question => ({
            ...question,
            answerCount: question.answerCount !== undefined ? question.answerCount : null
          }));
          setQuestions(questionsWithDefaults);
          setCurrentPage(1);
        } catch (error) {
          console.error('Error refreshing questions after replacement:', error);
          setError('Failed to refresh questions. Please refresh the page.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  };

  const renderContent = () => (
    <>
      {!isModalMode && (
        <>
          <div className="qop-header-bar">
            <div className="qop-breadcrumb-navigation">
              <button className="qop-back-button" onClick={() => navigate(-1)} aria-label="Go back">
                <span className="qop-back-icon" aria-hidden="true">←</span>
                <span>Back</span>
              </button>
              <div className="qop-breadcrumb-trail">
                {decodedBusinessName && (
                  <>
                    <span className="qop-breadcrumb-item">Org:</span>
                    <span className="qop-breadcrumb-value">{decodedBusinessName}</span>
                    <span className="qop-breadcrumb-separator">/</span>
                  </>
                )}
                {decodedDepartment && (
                  <>
                    <span className="qop-breadcrumb-item">Area:</span>
                    <span className="qop-breadcrumb-value">{decodedDepartment}</span>
                    <span className="qop-breadcrumb-separator">/</span>
                  </>
                )}
                <span className="qop-breadcrumb-item">Topic:</span>
                <span className="qop-breadcrumb-current">{decodedProject}</span>
              </div>
            </div>
            <div className="qop-help-mode-toggle-container">
              <span className="qop-help-mode-label">Help Mode</span>
              <button
                className={`qop-help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
                onClick={() => setHelpModeEnabled(!helpModeEnabled)}
                data-tooltip="Toggle help tooltips on/off"
                data-tooltip-position="left"
                aria-pressed={helpModeEnabled}
              >
                <div className="qop-help-mode-toggle-circle"></div>
                <span className="sr-only">Toggle help mode</span>
              </button>
            </div>
          </div>

          <div className="qop-topic-overview-header">
            <div className="qop-topic-title-wrapper">
              <h1 className="qop-main-title">{decodedProject}</h1>
              <span className="qop-topic-type-label">Topic Overview</span>
            </div>
            <p className="qop-topic-description">
              Ask questions, review existing answers, or enhance the AI's knowledge for this topic.
            </p>
          </div>
        </>
      )}

      <div className="qop-ask-question-section">
        <h2 className="qop-section-title">
          {isModalMode ? `Ask a New Question about ${decodedProject}` : "Ask a New Question"}
        </h2>
        <form className="qop-form-question" onSubmit={handleSubmit}>
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder='Enter a clear and concise title for your question'
            required
            className="qop-text-input"
            aria-label="Question title"
          />
          <TextArea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder="Provide details about your question..."
            required
            className="qop-text-area"
            aria-label="Question details"
            rows={isModalMode ? 3 : 5}
          />
          <button type="submit" className="qop-ask-question-button" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Ask Question'}
          </button>
        </form>
      </div>
      
      {!isModalMode && (
        <div className="qop-teach-ai-section">
          <Link
            to={`/upload-data/${currentBusinessName}/${currentDepartmentName}/${currentProjectName}/${currentProjectId}`}
            className="qop-teach-ai-link"
            data-tooltip="Upload your own documents to improve the AI's knowledge about this topic"
          >
            <span className="qop-teach-ai-icon" aria-hidden="true">🧠</span>
            Teach AI with your own data files
          </Link>
        </div>
      )}

      <div className="qop-existing-questions-section">
        <h2 className="qop-section-title">Existing Questions</h2>
        <div className="qop-search-container">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search existing questions by title or content..."
            className="qop-searchbar"
          />
        </div>

        {/* Export Section - Only show if user has permissions */}
        {(hasPermission || role === 'ROLE_ADMIN') && (
          <div className="qop-export-section">
            <div className="export-actions">
              <button 
                className="export-btn csv-btn"
                onClick={handleDownloadCSV}
                disabled={isExporting}
                title="Download as CSV file with questions and answers"
              >
                {isExporting ? '📤 Preparing...' : '💾 Download CSV'}
              </button>
              <button 
                className="export-btn replace-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Replace Q&A button clicked!');
                  openQAModal();
                }}
                disabled={isExporting}
                title="Replace all Q&A with CSV upload"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                🔄 Replace Q&A
              </button>
            </div>
            
            {exportMessage && (
              <div className="export-message">
                {exportMessage}
              </div>
            )}
          </div>
        )}




        {isLoading && !questions.length ? (
          <div className="qop-loading-container">
            <div className="qop-spinner"></div>
            <p className="qop-loading-message">Loading questions...</p>
          </div>
        ) : !isLoading && filteredQuestions.length === 0 && searchTerm ? (
          <div className="qop-no-questions qop-no-results">
            <span className="qop-no-questions-icon" aria-hidden="true">😕</span>
            <p>No questions match your search term "{searchTerm}".</p>
            <button onClick={() => setSearchTerm('')} className="qop-clear-search-button">Clear Search</button>
          </div>
        ) : !isLoading && questions.length === 0 ? (
          <div className="qop-no-questions">
            <span className="qop-no-questions-icon" aria-hidden="true">🤔</span>
            <p>No questions have been asked for this topic yet.</p>
            <p>Be the first to ask!</p>
          </div>
        ) : (
          <div className="question-list">
            {displayedQuestions.map((question) => {
              const isExpanded = expandedQuestions[question.questionId];
              
              return (
                <div key={question.questionId} className="question-item">
                  {/* Profile Section */}
                  <div className="question-profile">
                    <div className="profile-bubble">
                      Q
                    </div>
                    <div className="profile-info">
                      <div className="profile-name">Question</div>
                      <div className="profile-email">Topic: {decodedProject}</div>
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
                        {(hasPermission || role === 'ROLE_ADMIN') && (
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(question.questionId)}
                            aria-label="Delete question"
                          >
                            Delete
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
                        {getAnswerCount(question)} answers
                      </span>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button 
                      className="expand-btn"
                      onClick={() => toggleQuestionDetails(question.questionId)}
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
                            <span className="meta-value">{decodedProject}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Expertise:</span>
                            <span className="meta-value">{decodedDepartment}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Status:</span>
                            <span className="meta-value">{question.status}</span>
                          </div>
                        </div>

                        {/* Existing Answers */}
                        {questionAnswers[question.questionId] && questionAnswers[question.questionId].length > 0 && (
                          <div className="answers-section">
                            <h4 className="section-title">Previous Answers ({getAnswerCount(question)})</h4>
                            <div className="answers-list">
                              {questionAnswers[question.questionId].map((answer, index) => (
                                <div key={answer.answerId || index} className="answer-item">
                                  <div className="answer-text">{answer.answerText}</div>
                                  <div className="answer-metadata">
                                    <span className="answer-author">— {answer.userEmail || 'Agent'}</span>
                                    <span className="answer-date">{formatDate(answer.createdAt)}</span>
                                  </div>
                                  {(hasPermission || role === 'ROLE_ADMIN') && (
                                    <button 
                                      className="delete-answer-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAnswerDelete(answer.answerId, question.questionId);
                                      }}
                                      aria-label="Delete answer"
                                      title="Delete this answer"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Loading state for answers */}
                        {isAnswerLoading(question.questionId) && (
                          <div className="answers-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading answers...</p>
                          </div>
                        )}

                        {/* Error state for answers */}
                        {getAnswerError(question.questionId) && (
                          <div className="answers-error">
                            <span className="error-icon">⚠️</span>
                            <p>{getAnswerError(question.questionId)}</p>
                            <button 
                              className="retry-btn"
                              onClick={() => {
                                // Clear error and retry
                                setQuestionAnswers(prev => ({
                                  ...prev,
                                  [`${question.questionId}_error`]: null
                                }));
                                fetchAnswersForQuestion(question.questionId);
                              }}
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        {/* No answers message */}
                        {!isAnswerLoading(question.questionId) && 
                         !getAnswerError(question.questionId) && 
                         questionAnswers[question.questionId] && 
                         questionAnswers[question.questionId].length === 0 && (
                          <div className="no-answers-message">
                            <span className="no-answers-icon">💭</span>
                            <p>No answers yet for this question.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Load More / Loading indicator */}
            {displayedQuestions.length < filteredQuestions.length && (
              <div className="load-more-section">
                {isLoadingMore ? (
                  <div className="loading-more">
                    <div className="loading-spinner"></div>
                    <p>Loading more questions...</p>
                  </div>
                ) : (
                  <button 
                    className="load-more-btn"
                    onClick={loadMoreQuestions}
                  >
                    Load More Questions ({filteredQuestions.length - displayedQuestions.length} remaining)
                  </button>
                )}
              </div>
            )}
            
            {/* End of results message */}
            {displayedQuestions.length > 0 && displayedQuestions.length >= filteredQuestions.length && filteredQuestions.length > questionsPerPage && (
              <div className="end-of-results">
                <p>You've reached the end of all questions.</p>
              </div>
            )}
          </div>
        )}
      </div>
   
      {error && <p className="qop-error-message">{error}</p>}
    </>
  );

  const modalComponent = showQAModal && (
    <QAReplacementModal
      onClose={closeQAModal}
      projectId={currentProjectId}
      projectName={decodedProject}
      onSuccess={handleQAReplacementSuccess}
    />
  );

  if (isModalMode) {
    return (
      <>
        <div className={`qop-modal-content ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
          <div className="qop-modal-header">
            <h3 className="qop-modal-title">Questions: {decodedProject}</h3>
            <button
              onClick={() => {
                console.log(`[QOP Modal ${currentProjectId}] Close button clicked.`);
                if (onCloseModal) onCloseModal();
              }}
              className="qop-modal-close-button"
              aria-label="Close questions modal"
            >
              &times;
            </button>
          </div>
          <div className="qop-modal-body">
            {renderContent()}
          </div>
        </div>
        {/* Q&A Replacement Modal - Also render in modal mode */}
        {modalComponent}
      </>
    );
  }

  return (
    <div className={`question-overview-page ${helpModeEnabled ? 'qop-help-mode-enabled' : 'qop-help-mode-disabled'}`}>
      <div className="qop-container">
        {renderContent()}
      </div>
      
      {/* Q&A Replacement Modal */}
      {modalComponent}
    </div>
  );
};

export default QuestionOverviewPage;
