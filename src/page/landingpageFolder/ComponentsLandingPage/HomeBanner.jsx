import "./HomeBanner.css";
import { Helmet } from 'react-helmet-async';
// import { FaCheck } from "react-icons/fa6";
import bannerShape1 from "./images/main-demo/banner-shape1.png";
import bannerShape2 from "./images/main-demo/banner-shape2.png";
import bannerShape3 from "./images/main-demo/banner-shape3.png";
import getDemoSvg from "./images/main-demo/get-demo.svg";
import arrowRightSvg from "./images/icons/arrow-right.svg";
import heroImg from "./images/main-demo/hero-img.png";
import ScrollAnimate from "./Components/ScrollAnimate";

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

const HomeBanner = () => {
  return (
    <div className="home-banner hero-section">
      <Helmet>
        {/* Component-specific structured data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SupportHub - AI-Powered Customer Support",
              "description": "Revolutionize support with AI routing, expert assistance, and continuous learning",
              "url": "https://yourdomain.com/",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://yourdomain.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          `}
        </script>
      </Helmet>
      <div className="bg-shape">
        <div className="shape-img img-1">
          <ScrollAnimate delay={250}><img src={bannerShape1} alt="shpae1" /></ScrollAnimate>
        </div>
        <div className="shape-img img-2">
          <ScrollAnimate delay={220}><img src={bannerShape2} alt="shape2" /></ScrollAnimate>
        </div>
        <div className="shape-img img-3">
          <ScrollAnimate delay={240}><img src={bannerShape3} alt="shape3" /></ScrollAnimate>
        </div>
      </div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 col-md-12">
            <div className="hero-content">
              <div className="hero-content-text">
                <ScrollAnimate>
                  <h1 className="uig-banner-title white-color" id="main-headline">
                    Revolutionize <span className="hero-badge">Support</span>
                    <br />
                    with
                    <br />
                    <span className="typewriter-container" key="typewriter-v3">
                      <span className="typewriter">Smart AI Routing</span>
                      <span className="typewriter">Route to Experts</span>
                      <span className="typewriter">AI Continuous Learning</span>
                      <span className="typewriter">AI Knowledge Base</span>
                      <span className="typewriter">AI Cost Reduction</span>
                      <span className="typewriter">Instant AI Answers</span>
                      <span className="typewriter">Seamless AI Assistance</span>
                    </span>
                  </h1>
                </ScrollAnimate>

                <ScrollAnimate delay={200}>
                  <p>
                    SupportHub delivers AI-powered 24/7 assistance directly on your website, providing instant answers 
                    while intelligently routing complex inquiries to experts. Our system continuously learns from each 
                    interaction, eliminating repetitive support tasks and dramatically reducing costs.
                  </p>
                </ScrollAnimate>
              </div>
              <div className="hero-content-button mb-30">
                <ScrollAnimate delay={250}>
                  <a 
                    href="#pricing" 
                    className="hero-btn"
                    data-cta="primary"
                    aria-label="Get started with SupportHub"
                  >
                    Get Started <span className="ml-2" aria-hidden="true">→</span>
                  </a>
                </ScrollAnimate>
              </div>
              <ScrollAnimate delay={300}>
                <ul className="hero-content-list">
                  <li>
                    <div className="list-item">
                      <CheckIcon />
                      <p className="wt-700">No coding required</p>
                    </div>
                  </li>
                  <li>
                    <div className="list-item">
                      <CheckIcon />
                      <p className="wt-700">30 day free trial</p>
                    </div>
                  </li>
                </ul>
              </ScrollAnimate>
            </div>
          </div>
          <div className="col-lg-5 col-md12">
            <ScrollAnimate>
              <div className="hero-img">
                <img 
                  src={heroImg} 
                  alt="AI-powered support system dashboard interface" 
                  loading="eager" 
                  width="600" 
                  height="450"
                  fetchpriority="high"
                  srcSet={`${heroImg}?w=640 640w, ${heroImg}?w=1024 1024w, ${heroImg}?w=1366 1366w`}
                  sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 40vw"
                />
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;