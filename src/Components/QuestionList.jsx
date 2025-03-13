// QuestionList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Like from '../assets/Button/Like.png';

const QuestionList = ({ questions, onDelete, onLike }) => {
  return (
    <div className="question-overview-container">
      {questions.map((question) => (
        <div key={question.id} className="question-card-wrapper">
          <Link 
            to={`/question-detail/${question.id}/${encodeURIComponent(question.title)}/${encodeURIComponent(question.question)}/${question.projectId}`}
            className="question-card-link"
          >
            <div 
              className={question.status === 'Closed' ? 'question-overview-item-red' : 'question-overview-item'}
            >
              <div className="Question-Title-delete-Button-Container">
                <h3>{question.title}</h3>
                <button 
                  className="Delete-Button" 
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    e.stopPropagation(); // Prevent event bubbling
                    onDelete(question.id);
                  }}
                  aria-label="Delete question"
                >
                  ×
                </button>
              </div>
              
              <div className="Question-Card-Container">
                <p>{question.question}</p>
              </div>
              
              <div className="Question-Likes-Container">
                <span>Status: {question.status}</span>
                <div className="Question-Likes-Button-Container">
                  <span>{question.likes} likes</span>
                  <button 
                    className="Like-Button" 
                    onClick={(e) => {
                      e.preventDefault(); // Prevent navigation
                      e.stopPropagation(); // Prevent event bubbling
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
      ))}
    </div>
  );
};

export default QuestionList;
