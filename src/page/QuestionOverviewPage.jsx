// QuestionOverviewPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import './QuestionOverviewPage.css';
import SearchBar from '../Components/Searchbar';
import TextArea from '../Components/TextArea';
import TextInput from '../Components/TextInput';
import QuestionList from '../Components/QuestionList';
import { questions as questionsApi } from '../services/ApiService';
import Tooltip from '../Components/Tooltip';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { users as usersApi } from '../services/ApiService';

const QuestionOverviewPage = () => {
  const [questionText, setQuestionText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { project, department, projectId, businessName } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [pendingQuestionsLoaded, setPendingQuestionsLoaded] = useState(false);
  const [pendingUsersMap, setPendingUsersMap] = useState({});

  const { hasProjectPermission } = useUserPermissions();
  const hasPermission = hasProjectPermission(projectId);

  const decodedProject = decodeURIComponent(project);
  const decodedDepartment = decodeURIComponent(department);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        // Use the project-specific endpoint instead of getting all questions
        const response = await questionsApi.getByProjectId(projectId);
        
        // No need to filter anymore since the API is already returning project-specific questions
        const questionsData = response.data.map(question => ({
          id: question.questionId,
          title: question.questionTitle,
          question: question.questionText,
          status: question.status,
          projectId: question.projectId,
          createdAt: question.createdAt,
          likes: question.likes || 0,
          assignedAgentId: question.assignedAgentId
        }));
        
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError('Failed to fetch questions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchQuestions();
    }
  }, [projectId]);

  // Add this after fetchQuestions to log the question structure
  useEffect(() => {
    if (questions.length > 0) {
      console.log("Sample question structure:", questions[0]);
    }
  }, [questions]);

  // Set up Fuse.js with options
  const fuse = useMemo(() => {
    const options = {
      keys: ['title', 'question'],
      threshold: 0.3,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (title && questionText && projectId) {
      try {
        const response = await questionsApi.create({
          questionTitle: title,
          questionText: questionText,
          projectId: projectId,
          status: 'Open'
        });
        const newQuestion = {
          id: response.data.questionId,
          title: response.data.questionTitle,
          question: response.data.questionText,
          status: response.data.status,
          projectId: response.data.projectId,
          createdAt: response.data.createdAt,
          likes: 0,
          assignedAgentId: response.data.assignedAgentId
        };
        setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
        setTitle('');
        setQuestionText('');
      } catch (error) {
        console.error('Error posting question:', error);
        setError('Failed to post question. Please try again.');
      }
    } else {
      setError('Please enter a question and title');
    }
  };

  const handleDelete = async (id) => {
    try {
      await questionsApi.delete(id);
      setQuestions(prevQuestions => prevQuestions.filter(question => question.id !== id));
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Failed to delete question. Please try again.');
    }
  };

  const handleLike = async (questionId) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const updatedLikes = question.likes + 1;

      await questionsApi.patch(questionId, {
        likes: updatedLikes
      });

      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === questionId ? { ...q, likes: updatedLikes } : q
        )
      );
    } catch (error) {
      console.error('Error updating likes:', error);
      setError('Failed to update likes. Please try again.');
    }
  };

  const handleStatusChange = (updatedQuestion) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === updatedQuestion.questionId ? {
          ...q,
          status: updatedQuestion.status,
          assignedAgentId: updatedQuestion.assignedAgentId
        } : q
      )
    );
  };

  const fetchPendingQuestions = async () => {
    try {
      console.log('Fetching pending questions for project:', projectId);
      const response = await questionsApi.getPendingByProjectId(projectId);
      
      // Log ALL pending questions to see their full structure
      console.log('PENDING QUESTIONS FULL DATA:', response.data);
      
      // Extract and log just the agent IDs for easier debugging
      const agentIds = response.data.map(q => ({
        questionId: q.questionId,
        title: q.questionTitle,
        assignedAgentId: q.assignedAgentId,
        status: q.status
      }));
      console.log('PENDING QUESTIONS AGENT IDs:', agentIds);
      
      // Store the pending questions in state
      setPendingQuestions(response.data);
      
      // Extract unique agent IDs from pending questions
      const uniqueAgentIds = [...new Set(
        response.data
          .filter(q => q.assignedAgentId && q.assignedAgentId > 0)
          .map(q => q.assignedAgentId)
      )];
      
      console.log('UNIQUE AGENT IDs TO FETCH:', uniqueAgentIds);
      
      // Fetch user details for each agent ID
      const userMap = {};
      for (const agentId of uniqueAgentIds) {
        try {
          console.log(`FETCHING USER FOR AGENT ID: ${agentId}`);
          const userResponse = await usersApi.getById(agentId);
          console.log(`USER RESPONSE FOR AGENT ID ${agentId}:`, userResponse);
          
          if (userResponse && userResponse.data) {
            userMap[agentId] = userResponse.data;
            console.log(`MAPPED USER FOR AGENT ID ${agentId}:`, userMap[agentId]);
          }
        } catch (error) {
          console.error(`ERROR FETCHING USER FOR AGENT ID ${agentId}:`, error);
        }
      }
      
      console.log('FINAL PENDING USERS MAP:', userMap);
      setPendingUsersMap(userMap);
      setPendingQuestionsLoaded(true);
    } catch (error) {
      console.error('Error fetching pending questions:', error);
    }
  };

  useEffect(() => {
    if (projectId && !pendingQuestionsLoaded) {
      fetchPendingQuestions();
    }
  }, [projectId, questions]);

  return (
    <div className={`question-overview-page ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
      
      <div className="breadcrumb-navigation">
        <button className="back-button" onClick={() => navigate(-1)}>
          <span className="back-icon">←</span> Back to Organisation {businessName}
        </button>
        <div className="breadcrumb-trail">
          <span className="breadcrumb-item">Organisation:</span>
          <span className="breadcrumb-value">{businessName || "Business"}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Expertise Area:</span>
          <span className="breadcrumb-value">{decodedDepartment}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Topic:</span>
          <span className="breadcrumb-current">{decodedProject}</span>
        </div>
      </div>
      
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
      
      <div className="topic-overview-header">
        <div className="TopicTitleWrapper">
          <h1 className="question-overview-title">{decodedProject}</h1>
          <div className="TopicTypeLabel">Topic</div>
        </div>
   
      </div>
      
      <form className="form-question" onSubmit={handleSubmit}>
        <h2>Ask a New Question</h2>
        <TextInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder='Enter question title'
          required
        />
        <TextArea
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          placeholder="Ask a question..."
          required
        />
        <button type="submit" className="ask-question-button">Ask Question</button>
      </form>
      
      {/* Separate AI training link below the form */}
      <Link 
        to={`/upload-data/${businessName}/${department}/${project}/${projectId}`}
        className="teach-ai-link"
        data-tooltip="Upload your own documents to improve the AI's knowledge about this topic"
      >
        Teach AI with your own data files
      </Link>
      
      <div className="search-container">
        <Tooltip text="Search through existing questions">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search questions..."
          />
        </Tooltip>
      </div>
      
      {isLoading ? (
        <p className="loading-message">Loading questions...</p>
      ) : filteredQuestions.length === 0 ? (
        <div className="no-questions">
          <p>No questions found. Be the first to ask a question!</p>
        </div>
      ) : (
        <QuestionList 
          questions={filteredQuestions}
          onDelete={handleDelete}
          onLike={handleLike}
          hasPermission={hasPermission}
          businessName={businessName} 
          department={decodedDepartment}
          project={decodedProject}
          onStatusChange={handleStatusChange}
          pendingUsersMap={pendingUsersMap}
          pendingQuestions={pendingQuestions}
        />
      )}
   
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default QuestionOverviewPage;
