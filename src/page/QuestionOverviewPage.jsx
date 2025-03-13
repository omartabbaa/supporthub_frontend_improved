// QuestionOverviewPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import './QuestionOverviewPage.css';
import SearchBar from '../Components/Searchbar';
import TextArea from '../Components/TextArea';
import TextInput from '../Components/TextInput';
import QuestionList from '../Components/QuestionList';
import { questions as questionsApi } from '../services/ApiService';

const QuestionOverviewPage = () => {
  const [questionText, setQuestionText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { project, department, projectId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const decodedProject = decodeURIComponent(project);
  const decodedDepartment = decodeURIComponent(department);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await questionsApi.getAll();
        
        // Filter questions with the correct projectId
        const filteredQuestions = response.data.filter(question => question.projectId === parseInt(projectId));
        
        const questionsData = filteredQuestions.map(question => ({
          id: question.questionId,
          title: question.questionTitle,
          question: question.questionText,
          status: question.status,
          projectId: question.projectId,
          createdAt: question.createdAt,
          likes: question.likes || 0,
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

  return (
    <div className="question-overview-page">
      <h1 className="question-overview-title">{decodedProject}</h1>
      <h2 className="question-overview-department">{decodedDepartment}</h2>
      
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
        <button type="submit">Ask Question</button>
      </form>
      
      <div className="search-container">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search questions..."
        />
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
        />
      )}
      
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default QuestionOverviewPage;
