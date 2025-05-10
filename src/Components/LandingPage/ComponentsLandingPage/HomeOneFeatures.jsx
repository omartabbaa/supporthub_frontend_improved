import React from "react";
import "./HomeOneFeater.css";
import SectionTitle from "./Components/SectionTitle/SectionTitle";
import FrameImage from "./images/main-demo/Frame.svg";
import ScrollAnimate from "./Components/ScrollAnimate";

// Icons for the feature cards
const learningIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 3.34L17.66 9 12 11.66 6.34 9 12 6.34zM1 13v6l11 6 11-6v-6l-11 6-11-6z"/>
  </svg>
);

const responseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const routingIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/>
  </svg>
);

const emailIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const replyIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
  </svg>
);

const adminIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

const HomeOneFeatures = () => {
  // Define data with the new feature descriptions
  const homeOneFeaturesData = [
    {
      cardclassName: "feature-card home-one-feature-card",
      cardTitle: "Learning AI Support",
      cardText: "SupportHub continuously improves its performance by learning from every customer interaction. Its advanced AI algorithms analyze both questions and expert responses, refining its answers over time.",
      icon: learningIcon,
      animetiondelay: 200
    },
    {
      cardclassName: "feature-card home-one-feature-card",
      cardTitle: "Instant, Accurate Responses",
      cardText: "The AI quickly searches your comprehensive knowledge base to retrieve the best answers for customer inquiries. This rapid response mechanism minimizes wait times and reduces the need for follow-up questions.",
      icon: responseIcon,
      animetiondelay: 250
    },
    {
      cardclassName: "feature-card home-one-feature-card",
      cardTitle: "Smart Query Routing",
      cardText: "SupportHub automatically directs complex inquiries to the right experts based on the nature of the question. This smart routing feature ensures that each issue is handled by someone with the appropriate expertise.",
      icon: routingIcon,
      animetiondelay: 300
    },
    {
      cardclassName: "feature-card home-one-feature-card",
      cardTitle: "Expert Email Notifications",
      cardText: "When a customer question requires human intervention, SupportHub sends prompt email notifications to the designated experts. This ensures that experts are immediately aware of inquiries needing their attention.",
      icon: emailIcon,
      animetiondelay: 350
    },
    {
      cardclassName: "feature-card home-one-feature-card",
      cardTitle: "Direct Customer Email Replies",
      cardText: "After an expert crafts a response, the system sends it directly to the customer's email address. This direct communication channel provides a seamless experience, ensuring that detailed, personalized answers reach customers.",
      icon: replyIcon,
      animetiondelay: 400
    },
    {
      cardclassName: "feature-card home-one-feature-card",
      cardTitle: "Admin Control & Expert Assignment",
      cardText: "A dedicated admin interface allows you to assign specific experts to handle particular types of questions. You can set up routing criteria based on expertise, ensuring that inquiries are matched with the best available resource.",
      icon: adminIcon,
      animetiondelay: 450
    }
  ];

  return (
    <div className="home-one-features">
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <ScrollAnimate delay={200}>
              <SectionTitle
                subtitle="Key Features"
                title="AI-Powered Support Benefits"
                parentClass="md-mb-0 text-center"
              />
            </ScrollAnimate>
          </div>
        </div>
        <div className="staco-hover-effect">
          {homeOneFeaturesData?.map((info, i) => {
            return (
              <ScrollAnimate key={i} delay={info?.animetiondelay}>
                <div className={info?.cardclassName}>
                  <div className="feature-card-shape">
                  
                    <div className="feature-card-content">
                      <div className="feature-card-icon">
                        {info?.icon}
                      </div>
                      <div className="feature-card-text">
                        <h5 className="wt-700">{info?.cardTitle}</h5>
                        <p>{info?.cardText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimate>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeOneFeatures;
