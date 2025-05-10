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
      title: "Free Plan",
      price: "0",
      features: [
        "1 department",
        "1 project",
        "1 agent",
        "No extra agent cost",
        "20 conversations/month",
        "No extra conversation cost"
      ],
      recommended: false,
      buttonText: "Get Started",
      delay: 50
    },
    {
      title: "Starter",
      price: isYearly ? "25" : "29",
      features: [
        "3 departments",
        "9 projects (3 per department)",
        "10 agents",
        "$5 per extra agent",
        "100 conversations/month",
        "$0.25 per extra conversation"
      ],
      recommended: false,
      buttonText: "Get Started",
      delay: 100
    },
    {
      title: "Growth",
      price: isYearly ? "99" : "119",
      features: [
        "5 departments",
        "15 projects (3 per department)",
        "10 agents",
        "$5 per extra agent",
        "500 conversations/month",
        "$0.25 per extra conversation"
      ],
      recommended: true,
      buttonText: "Get Started",
      delay: 200
    },
    {
      title: "Scale",
      price: isYearly ? "249" : "299",
      features: [
        "10 departments",
        "30 projects (3 per department)",
        "10 agents",
        "$5 per extra agent",
        "1,000 conversations/month",
        "$0.20 per extra conversation"
      ],
      recommended: false,
      buttonText: "Get Started",
      delay: 300
    },
    {
      title: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited departments",
        "Unlimited projects",
        "Unlimited agents",
        "Negotiable pricing",
        "10,000+ conversations",
        "Volume discount"
      ],
      recommended: false,
      buttonText: "Contact Us",
      delay: 400
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
                    {plan.price !== "Custom" ? (
                      <>
                        <span className="currency">$</span>
                        <span className="amount">{plan.price}</span>
                        <span className="period">/{isYearly ? "year" : "month"}</span>
                      </>
                    ) : (
                      <span className="amount">Custom Pricing</span>
                    )}
                  </div>
                  <p className="per-user">per organization</p>
                </div>
                <div className="pricing-card-body">
                  <ul className="feature-list">
                    <li>
                      <CheckIcon />
                      <span><strong>Departments:</strong> {plan.features[0]}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span><strong>Projects:</strong> {plan.features[1]}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span><strong>Agents:</strong> {plan.features[2]}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span><strong>Extra Agent Cost:</strong> {plan.features[3]}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span><strong>Conversations:</strong> {plan.features[4]}</span>
                    </li>
                    <li>
                      <CheckIcon />
                      <span><strong>Extra Conv. Cost:</strong> {plan.features[5]}</span>
                    </li>
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
