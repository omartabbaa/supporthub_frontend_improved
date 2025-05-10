// QuestionDetailPage.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './QuestionDetailPage.css';
import { permissions as permissionsApi, answers as answersApi } from "../services/ApiService";
import { useUserContext } from "../context/LoginContext";
import TextArea from '../Components/TextArea';
import AnswerList from '../Components/AnswerList';
import Tooltip from '../Components/Tooltip';

const QuestionDetailPage = () => {
  const { businessName, department, project, questionId, title, question, projectId } = useParams();
  const { userId } = useUserContext();
  const navigate = useNavigate();

  const decodedTitle = decodeURIComponent(title);
  const decodedQuestion = decodeURIComponent(question);
  const decodedBusinessName = businessName ? decodeURIComponent(businessName) : "Business";
  const decodedDepartment = department ? decodeURIComponent(department) : "Department";
  const decodedProject = project ? decodeURIComponent(project) : "Topic";

  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [canAnswerQuestion, setCanAnswerQuestion] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);

  useEffect(() => {
    console.log("URL params in QuestionDetailPage:", { businessName, department, project });
  }, [businessName, department, project]);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        // Use the targeted endpoint that only returns permissions for this user
        const response = await permissionsApi.getByUserId(userId);
        
        // Check if user has permission to answer this specific project's questions
        const hasPermission = response.data.some(permission => 
          permission.projectId === parseInt(projectId) && permission.canAnswer === true
        );
        
        setCanAnswerQuestion(hasPermission);
        console.log(`User ${userId} has permission to answer questions for project ${projectId}: ${hasPermission}`);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setError('Failed to fetch permissions.');
        setCanAnswerQuestion(false);
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (userId && projectId) {
      fetchUserPermissions();
    } else {
      setLoadingPermissions(false);
      setCanAnswerQuestion(false);
    }
  }, [userId, projectId]);

  useEffect(() => {
    const fetchAnswers = async () => {
      setLoadingAnswers(true);
      setError('');
      try {
        const response = await answersApi.getAll();
        if (Array.isArray(response.data)) {
          const filteredAnswers = response.data.filter(
            (ans) => ans.questionId === parseInt(questionId, 10)
          );
          setAnswers(filteredAnswers);
        } else {
          setError('Unexpected response format.');
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setError('Answers not found.');
        } else {
          setError('Failed to fetch answers.');
        }
      } finally {
        setLoadingAnswers(false);
      }
    };

    if (questionId) {
      fetchAnswers();
    } else {
      setError('Invalid question ID.');
      setLoadingAnswers(false);
    }
  }, [questionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setSubmitError('Answer cannot be empty');
      return;
    }
    
    try {
      // Log the data we're about to send
      console.log("Submitting answer with notification for question ID:", questionId);
      
      const payload = {
        // Don't include answerId - let the server generate it
        answerText: answer,
        questionId: parseInt(questionId, 10),
        userId: userId
      };
      
      console.log("Sending answer payload:", payload);
      
      // Use the submit method instead of create to trigger email notifications
      const response = await answersApi.submit(payload);

      if (response.data) {
        console.log("Answer submitted successfully with notification:", response.data);
        setAnswers([...answers, response.data]);
        setSubmitSuccess('Answer submitted successfully with notification sent!');
        setAnswer(''); // Clear the input field
      } else {
        setSubmitError('Failed to submit answer - no data returned.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      
      let errorMessage = 'Error submitting answer. Please try again.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.data && error.response.data.error) {
          errorMessage = `Server error: ${error.response.data.error}`;
          
          // Check for specific constraint error
          if (error.response.data.error.includes('constraint')) {
            errorMessage = 'Database constraint error. Your answer may be a duplicate or missing required information.';
          }
        }
      }
      
      setSubmitError(errorMessage);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    try {
      await answersApi.delete(answerId);
      setAnswers(answers.filter(ans => ans.answerId !== answerId));
      setSubmitSuccess('Answer deleted successfully!');
    } catch (error) {
      console.error('Error deleting answer:', error);
      setSubmitError('Failed to delete answer. Please try again.');
    }
  };

  return (
    <div className={`question-detail-page ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
      <div className="breadcrumb-navigation">
        <button className="back-button" onClick={() => navigate(-1)}>
          <span className="back-icon">←</span> Back to Topic {decodedProject}
        </button>
        <div className="breadcrumb-trail">
          <span className="breadcrumb-item">Organisation:</span>
          <span className="breadcrumb-value">{decodedBusinessName}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Expertise Area:</span>
          <span className="breadcrumb-value">{decodedDepartment}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Topic:</span>
          <span className="breadcrumb-value">{decodedProject}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Question:</span>
          <span className="breadcrumb-current">{decodedTitle}</span>
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

      <div className="question-detail-container" data-tooltip="This is the original question that was asked">
        <h1 className="question-title">{decodedTitle}</h1>
        <p className="question-content">{decodedQuestion}</p>
      </div>

      <div className="answers-container" data-tooltip="View all answers from experts for this question">
        <AnswerList 
          answers={answers} 
          loadingAnswers={loadingAnswers} 
          error={error} 
          handleDeleteAnswer={handleDeleteAnswer}
        />
      </div>

      <form className="question-answer-form" onSubmit={handleSubmit}>
        <h2>Submit Your Answer</h2>
        <p className="notification-info">
          <small>When you submit an answer, the question creator will receive an email notification.</small>
        </p>
        {!canAnswerQuestion && !loadingPermissions && (
          <p className="permission-warning">
            You don't have permission to answer questions for this project.
          </p>
        )}
        <TextArea
          className="question-answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          required
          disabled={!canAnswerQuestion}
        />
        <button
          className={`question-answer-submit-button ${!canAnswerQuestion ? 'no-permission' : ''}`}
          type="submit"
          disabled={loadingPermissions || !canAnswerQuestion}
        >
          {loadingPermissions ? 'Checking Permissions...' : 
           canAnswerQuestion ? 'Submit Answer with Notification' : 'No Permission to Answer'}
        </button>
        {loadingPermissions && <p className="loading-message">Checking permissions...</p>}
        {submitError && <p className="error-message">{submitError}</p>}
        {submitSuccess && <p className="success-message">{submitSuccess}</p>}
      </form>
    </div>
  );
};

export default QuestionDetailPage;
