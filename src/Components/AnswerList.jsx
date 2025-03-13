import React from 'react';

const AnswerList = ({ answers, loadingAnswers, error, handleDeleteAnswer }) => {
  if (loadingAnswers) {
    return <p className="loading-message">Loading answers...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (answers.length === 0) {
    return <div className="no-answers"><p>No answers yet. Be the first to answer this question!</p></div>;
  }

  return (
    <div className="answers-list">
      {answers.map((answer) => (
        <div key={answer.answerId} className="answer-item">
          <div className="answer-metadata">
            <span>Answered by: {answer.userName || 'Anonymous'}</span>
            <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="answer-text">{answer.answerText}</div>
          <button
            className="delete-answer-button"
            onClick={() => handleDeleteAnswer(answer.answerId)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnswerList;
