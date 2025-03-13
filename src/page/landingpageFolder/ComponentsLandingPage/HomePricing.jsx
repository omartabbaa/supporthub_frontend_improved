import React, { useState } from "react";
import "./HomePricing.css";
import SectionTitle from "./Components/SectionTitle/SectionTitle";
// import { FaArrowRight } from "react-icons/fa6";

import PricingShape1Image from "./images/shape/pricing-shape1.png";
import PricingShape2Image from "./images/shape/pricing-shape2.png";
import PricingShape3Image from "./images/shape/pricing-shape3.png";
import Ellipse1Image from "./images/shape/ellipse1.png";
import Ellipse2Image from "./images/shape/ellipse2.png";
import ScrollAnimate from "./Components/ScrollAnimate";

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

// Create a check icon component instead of using react-icons
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

// Inline SVG icons
const starterIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
  </svg>
);

const proIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
  </svg>
);

const enterpriseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
  </svg>
);

const HomePricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  
  const pricingData = [
    {
      title: "Starter",
      price: isYearly ? "29" : "39",
      features: [
        "AI-powered widget for your website",
        "Up to 300 AI responses per month",
        "Basic question routing",
        "Email notifications for experts",
        "Knowledge base learning",
        "1 expert account",
        "Standard support"
      ],
      recommended: false,
      buttonText: "Get Started",
      delay: 100
    },
    {
      title: "Professional",
      price: isYearly ? "79" : "99",
      features: [
        "Everything in Starter, plus:",
        "Up to 1,500 AI responses per month",
        "Advanced routing algorithms",
        "Priority email notifications",
        "Enhanced knowledge learning",
        "5 expert accounts",
        "White-labeled widget",
        "Custom branding options",
        "Priority support"
      ],
      recommended: true,
      buttonText: "Get Started",
      delay: 200
    },
    {
      title: "Enterprise",
      price: isYearly ? "199" : "249",
      features: [
        "Everything in Professional, plus:",
        "Unlimited AI responses",
        "Custom routing rules",
        "Advanced analytics dashboard",
        "Expert performance metrics",
        "Unlimited expert accounts",
        "API access for custom integration",
        "Dedicated account manager",
        "24/7 priority support"
      ],
      recommended: false,
      buttonText: "Contact Us",
      delay: 300
    }
  ];

  return (
    <div className="home-pricing-section section-padding" id="pricing" style={{ marginBottom: '150px' }}>
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <ScrollAnimate>
              <SectionTitle
                subtitle="PRICING PLANS"
                title="Choose the Perfect Plan for Your Support Needs"
                text="Simple, transparent pricing that grows with your business. All plans include a 30-day free trial."
                parentClass="md-mb-0 text-center"
              />
            </ScrollAnimate>

            <ScrollAnimate delay={100}>
              <div className="pricing-toggle">
                <span className={!isYearly ? "active" : ""}>Monthly</span>
                <div className="toggle-switch" onClick={() => setIsYearly(!isYearly)}>
                  <div className={`toggle-button ${isYearly ? "yearly" : ""}`}></div>
                </div>
                <span className={isYearly ? "active" : ""}>Yearly <span className="save-badge">Save 20%</span></span>
              </div>
            </ScrollAnimate>
          </div>
        </div>

        <div className="pricing-cards">
          {pricingData.map((plan, index) => (
            <ScrollAnimate key={index} delay={plan.delay}>
              <div className={`pricing-card ${plan.recommended ? "recommended" : ""}`}>
                {plan.recommended && <div className="recommended-badge">Most Popular</div>}
                <div className="pricing-card-header">
                  <h3>{plan.title}</h3>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/{isYearly ? "year" : "month"}</span>
                  </div>
                  <p className="per-user">per website</p>
                </div>
                <div className="pricing-card-body">
                  <ul className="feature-list">
                    {plan.features.map((feature, i) => (
                      <li key={i}>
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pricing-card-footer">
                  <a 
                    href={plan.title === "Enterprise" ? "#contact" : "#signup"} 
                    className="pricing-button"
                  >
                    {plan.buttonText}
                  </a>
                </div>
              </div>
            </ScrollAnimate>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePricing;
