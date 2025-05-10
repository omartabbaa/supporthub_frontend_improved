import { useState } from "react";
import FaqBtnStyleWrpper from "./FaqBtn.style";

const FaqBtn = ({ data, index }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = () => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <FaqBtnStyleWrpper className="accordion-item" key={index}>
      <h2 className="accordion-header">
        <button
          className={`accordion-button ${
            activeIndex === index ? "" : "collapsed"
          }`}
          type="button"
          onClick={toggleAccordion}
        >
          {data?.question}
        </button>
      </h2>
      <div
        className={`accordion-collapse ${
          activeIndex === index ? "show" : "collapse"
        }`}
      >
        <div className="accordion-body">
          <p>{data?.answer}</p>
        </div>
      </div>
    </FaqBtnStyleWrpper>
  );
};

export default FaqBtn;
