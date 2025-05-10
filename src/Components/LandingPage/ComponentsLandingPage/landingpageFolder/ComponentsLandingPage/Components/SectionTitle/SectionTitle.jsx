import React, { useEffect } from "react";
import "./SectionTitle.css";

const SectionTitle = ({
  title,
  subtitle,
  parentClass,
  titleClass,
  subtitleClass,
}) => {
  return (
    <div className={`section-title-wrapper ${parentClass || ""}`}>
      {subtitle && (
        <div className={`subtitle ${subtitleClass || ""}`}>
          <p>{subtitle}</p>
        </div>
      )}
      {title && (
        <div className={`title ${titleClass || ""}`}>
          <h2>{title}</h2>
        </div>
      )}
    </div>
  );
};

export default SectionTitle;
