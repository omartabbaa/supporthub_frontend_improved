import React from "react";
import "./CustomPieProgress.css";

const CustomPieProgress = ({ 
  Percentage, 
  Text, 
  TextColor, 
  ValueColor, 
  PathColor,
  TrailColor 
}) => {
  // Create SVG circle path for the progress bar
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (100 - Percentage) / 100 * circumference;

  return (
    <div className="custom-pie-progress" style={{ color: TextColor }}>
      <svg className="progress-ring" width="100" height="100">
        <circle 
          className="progress-ring__circle-bg" 
          stroke={TrailColor}
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle 
          className="progress-ring__circle"
          stroke={PathColor} 
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <div className="pie-text">
        <h2 style={{ color: ValueColor }}>{Percentage}%</h2>
        <p>{Text}</p>
      </div>
    </div>
  );
};

export default CustomPieProgress;
