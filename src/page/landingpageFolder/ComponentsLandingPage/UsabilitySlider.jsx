import { useEffect, useState } from "react";
import "./UsabilitySlider.css";
import SectionTitle from "./Components/SectionTitle/SectionTitle";

import Img1 from "./images/main-demo/1.png";
import Img2 from "./images/main-demo/2.png";
import Img3 from "./images/main-demo/3.png";
import EmojiHappyIcon from "./images/main-demo/emoji-happy.png";
import PetIcon from "./images/main-demo/pet.png";
import MouseCircleIcon from "./images/main-demo/mouse-circle.png";
import Shape1Img from "./images/main-demo/shape1.png";
import Shape2Img from "./images/main-demo/shape2.png";
import ScrollAnimate from "./Components/ScrollAnimate";

const UsabilitySlider = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const slides = [
    {
      imgSrc: Img1,
      alt: "Easy to use interface screenshot",
      iconSrc: EmojiHappyIcon,
      title: "Easy to use",
    },
    {
      imgSrc: Img2,
      alt: "Collaborative features screenshot",
      iconSrc: PetIcon,
      title: "Collaborative",
    },
    {
      imgSrc: Img3,
      alt: "Customizable options screenshot",
      iconSrc: MouseCircleIcon,
      title: "Customizable",
    },
  ];

  // Auto advance disabled for debugging
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setActiveSlide((prev) => (prev + 1) % slides.length);
  //   }, 5000);
  //   return () => clearInterval(timer);
  // }, []);

  return (
    <div className="usability-section">
      <div className="bg-shape">
        <div className="shape-img img-1">
          <img src={Shape1Img} alt="shape1" />
        </div>
        <div className="shape-img img-2">
          <img src={Shape2Img} alt="shape2" />
        </div>
      </div>

      <div className="container">
        <div className="column-slider">
          {/* Section Title with reduced margins */}
          <div className="section-title">
            <h5>Simple & Easy</h5>
            <h2>AI Support Made Simple</h2>
          </div>

          {/* Navigation buttons */}
          <div className="slider-tabs">
            {slides.map((slide, index) => (
              <button 
                key={index} 
                className={`tab-button ${index === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(index)}
              >
                <img src={slide.iconSrc} alt={slide.title} className="tab-icon" />
                <span>{slide.title}</span>
              </button>
            ))}
          </div>
          
          {/* Centered image container */}
          <div className="slider-images">
            {slides.map((slide, index) => (
              <div 
                key={index} 
                className="slide" 
                style={{ 
                  display: index === activeSlide ? 'flex' : 'none',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <img 
                  src={slide.imgSrc} 
                  alt={slide.alt}
                  className="feature-image" 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsabilitySlider;
