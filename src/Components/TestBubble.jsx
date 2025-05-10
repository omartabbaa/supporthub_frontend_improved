import React from 'react';

const TestBubble = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: '999',
      backgroundColor: 'red',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '50%',
      fontWeight: 'bold',
      border: '2px solid white'
    }}>
      TEST
    </div>
  );
};

export default TestBubble; 