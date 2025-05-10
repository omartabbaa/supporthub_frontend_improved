import React from "react";
import "../../TitleStyle.css";

const TitleWithBadge = ({ children, badge }) => {
  return (
    <div className="title-with-badge">
      <span className="badge">{badge || children}</span>
      <span className="badge-bg"></span>
    </div>
  );
};

export default TitleWithBadge;