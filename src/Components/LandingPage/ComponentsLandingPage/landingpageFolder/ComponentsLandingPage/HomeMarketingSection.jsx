import { useEffect, useRef } from "react";
import "./HomeMarketing.css";
import SectionTitle from "./Components/SectionTitle/SectionTitle";
import TitleWithBadge from "./Components/Title/TitleWithBadge";
import "./TitleStyle.css";
import CustomPieProgress from "./Components/CustomPieProgress";

import ChartImage from "./images/shape/chart-1.svg";
import EmojiIconsImage from "./images/shape/emoji.svg";
import Star1Image from "./images/shape/star1.svg";
import Star2Image from "./images/shape/star2.svg";
import Star3Image from "./images/shape/star3.svg";
import M1Image from "./images/main-demo/m1.png";
import Ellipse1Image from "./images/main-demo/ellipse1.png";
import Ellipse2Image from "./images/main-demo/ellipse2.png";
import Ellipse3Image from "./images/main-demo/ellipse3.png";
import Ellipse4Image from "./images/main-demo/ellipse4.png";
import ManImage from "./images/main-demo/man.png";
import M2Image from "./images/main-demo/m2.png";
import Star4Image from "./images/shape/star-4.svg";
import ItemShapeImage from "./images/shape/item-shape.svg";
import WaveShapeImage from "./images/shape/wave-shape.svg";
// import { FaCheck } from "react-icons/fa6";
// import { GoArrowRight } from "react-icons/go";
import ScrollAnimate from "./Components/ScrollAnimate";

// Create a check icon component
const CheckIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="#00cec9"
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

// Create an arrow right icon component
const ArrowRightIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
  </svg>
);

const HomeMarketingSection = () => {
  return (
    <div className="home-one-marketing-section section-padding" style={{ marginTop: '150px', marginBottom: '150px' }}>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-12">
            <ScrollAnimate>
              <div className="marketing-content">
                <SectionTitle
                  subtitle="WHY CHOOSE SUPPORTHUB"
                  title="Transform Your Customer Support"
                  parentClass="mb-30"
                />
                <div className="marketing-text">
                  <p>
                    SupportHub is an AI-powered assistant that delivers 24/7 support directly on your website. 
                    Our custom widgets let customers submit questions easily and receive instant answers, 
                    while the system automatically routes complex queries to the right experts.
                  </p>
                  <p>
                    It continuously learns from expert responses to build a reliable database of questions 
                    and answers, so you don't have to address the same inquiry twice. This efficient 
                    process saves time and money by automating standard support tasks.
                  </p>
                  <p>
                    With expert email notifications, admin control panel, and direct customer 
                    email replies, SupportHub creates a seamless experience that improves both 
                    customer satisfaction and operational efficiency.
                  </p>
                  <div className="marketing-button">
                    <a href="#pricing" className="btn-yellow">
                      Get Started
                    </a>
                  </div>
                </div>
              </div>
            </ScrollAnimate>
          </div>
          <div className="col-lg-6 col-md-12">
            <ScrollAnimate delay={200}>
              <div className="marketing-img">
                <img src={M1Image} alt="marketing-img" />
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeMarketingSection;
