import React from 'react';
import './BubbleCounter.css';

const BubbleCounter = ({ count }) => {
  if (count <= 0) return null;

  return (
    <span className="bubble-counter">
      {count}
    </span>
  );
};

export default BubbleCounter; 