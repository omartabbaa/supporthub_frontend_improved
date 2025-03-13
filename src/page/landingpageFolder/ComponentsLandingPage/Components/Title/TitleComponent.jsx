import React from "react";
import TitleStyleWrapper from "./Title.style";

const TitleComponent = ({ title, subtitle, parentClass }) => {
  return (
    <TitleStyleWrapper>
      <div className={parentClass}>
        <span className="sub-title">{subtitle}</span>
        <h2 className="title">{title}</h2>
      </div>
    </TitleStyleWrapper>
  );
};

export default TitleComponent;
