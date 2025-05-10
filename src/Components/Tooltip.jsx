import React from 'react';
import './Tooltip.css';

const Tooltip = ({ text, position = "top", children }) => {
  return (
    <div className="tooltip-wrapper">
      <div className="tooltip-trigger" data-tooltip={text} data-tooltip-position={position}>
        {children}
      </div>
    </div>
  );
};

export default Tooltip; 