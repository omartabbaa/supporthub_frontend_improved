import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from "../context/LoginContext";
import './NewLandingPage.css';
import logo from '../assets/Logo/navbarLogo.png';

const NewLandingPage = () => {
  const { isLogin, role } = useUserContext();
  
  // Counter effect for statistics
  const statsRef = useRef(null);
  
  useEffect(() => {
    let isAnimated = false;
    
    function animateCounters() {
      if (!isAnimated) {
        const counterItems = document.querySelectorAll(".counter");
        counterItems.forEach((item) => {
          const targetValue = +item.getAttribute("data-target");
          let currentValue = 0;
          const increment = targetValue / 100;
          
          const updateCounter = () => {
            if (currentValue < targetValue) {
              currentValue += increment;
              item.textContent = Math.ceil(currentValue);
              setTimeout(updateCounter, 10);
            } else {
              item.textContent = targetValue;
            }
          };
          
          updateCounter();
        });
        isAnimated = true;
      }
    }
    
    const handleScroll = () => {
      if (!statsRef.current) return;
      const elementPosition = statsRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementPosition < windowHeight * 0.75) {
        animateCounters();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="new-landing-page">
      {/* Hero Banner Section */}
      <section className="hero-section">
        <div className="shape-background">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <div className="hero-content">
                <h1>
                  Revolutionize <span className="hero-badge">Support</span><br />
                  with AI-Powered Assistance
                </h1>
                <p className="hero-subtitle">
                  Turn your website into a 24/7 AI support assistant. Boost efficiency & customer satisfaction with instant answers, smart routing, and seamless AI + human support.
                </p>
                <div className="cta-buttons">
                  {!isLogin ? (
                    <>
                      <Link to="/login" className="cta-button primary">
                        <span className="btn-inner">
                          <span className="btn-normal-text">Sign In</span>
                          <span className="btn-hover-text">Sign In</span>
                        </span>
                      </Link>
                      <Link to="/signup" className="cta-button secondary">
                        <span className="btn-inner">
                          <span className="btn-normal-text">Start For Free</span>
                          <span className="btn-hover-text">Start For Free</span>
                        </span>
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to={role === "ROLE_ADMIN" ? "/admin-dashboard" : "/business-overview"} 
                      className="cta-button primary"
                    >
                      <span className="btn-inner">
                        <span className="btn-normal-text">Dashboard</span>
                        <span className="btn-hover-text">Dashboard</span>
                      </span>
                    </Link>
                  )}
                </div>
                <ul className="hero-features-list">
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>No coding required</p>
                    </div>
                  </li>
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>30 day free trial</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="hero-image">
                <div className="image-container">
                  <img src={logo} alt="Support Hub Platform" className="hero-logo" />
                  <div className="platform-demo">AI-Powered Support Solution</div>
                </div>
                <div className="get-demo-button">
                  <div className="rotating-text">
                    <span>Get Demo • Get Demo • Get Demo •</span>
                  </div>
                  <div className="demo-icon">→</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Section - Updated Content */}
      <section className="marketing-section">
        <div className="container">
          <div className="row marketing-row">
            <div className="col-lg-6">
              <div className="marketing-image">
                <div className="image-container">
                  <div className="chart-overlay">
                    <div className="chart-box">
                      <div className="chart-content">
                        <span>AI Support</span>
                      </div>
                    </div>
                  </div>
                  <div className="emoji-overlay">
                    <div className="emoji-box">
                      <span>😀 🤖 👨‍💼 👩‍💼 💬</span>
                    </div>
                  </div>
                  <div className="star-overlay star-1">★</div>
                  <div className="star-overlay star-2">★</div>
                  <div className="star-overlay star-3">★</div>
                  <div className="main-image"></div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="marketing-content">
                <div className="section-subtitle">Why SupportHub Stands Out</div>
                <h2>Transform Your Customer Support Experience</h2>
                <p>
                  SupportHub leverages artificial intelligence to revolutionize how businesses handle support inquiries. 
                  Our platform delivers immediate responses, learns from interactions, and seamlessly coordinates 
                  between AI and human support teams.
                </p>
                <ul className="marketing-list">
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>Reduce support tickets by up to 50%</p>
                    </div>
                  </li>
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>Enhance customer experience with 24/7 availability</p>
                    </div>
                  </li>
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>Save valuable team time and resources</p>
                    </div>
                  </li>
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>Intuitive setup with no coding required</p>
                    </div>
                  </li>
                  <li>
                    <div className="list-item">
                      <span className="check-icon">✓</span>
                      <p>Scale effortlessly as your business grows</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Updated Content */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="row marketing-row">
            <div className="col-lg-6">
              <div className="marketing-content">
                <div className="section-subtitle">Proven Results</div>
                <h2>Measurable Impact on Your Business</h2>
                <p>
                  SupportHub doesn't just improve your support operations - it delivers 
                  measurable results that directly impact your bottom line. Our clients 
                  consistently report significant improvements in support efficiency, 
                  customer satisfaction scores, and team productivity.
                </p>
                <Link to="/signup" className="text-link">
                  <span>See Case Studies</span>
                  <span className="arrow-icon">→</span>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="stats-container">
                <div className="main-stats-image"></div>
                <div className="stats-overlay reduction-time">
                  <div className="reduction-time-box">
                    <div className="reduction-header">
                      <h3><span className="counter" data-target="40">0</span>%</h3>
                      <span className="star-icon">★</span>
                    </div>
                    <p>Reduction in support time</p>
                  </div>
                </div>
                <div className="stats-overlay success-rate">
                  <div className="rotating-badge">
                    <div className="badge-inner"></div>
                  </div>
                  <div className="success-rate-content">
                    <div className="progress-circle">
                      <div className="progress-inner">
                        <h3><span className="counter" data-target="85">0</span>%</h3>
                        <p>Success rate</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="stats-overlay wave-shape">
                  <div className="wave-line">〰️</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SupportHub Section */}
      <section className="features-section">
        <div className="container">
          <h2>Why Choose SupportHub?</h2>
          <p className="section-subtitle">The smartest way to handle customer and internal inquiries</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span>🤖</span>
              </div>
              <h3>AI-Powered Chatbot</h3>
              <p>Automate support without human intervention. Available 24/7 to assist your customers.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span>🔍</span>
              </div>
              <h3>Instant, Relevant Responses</h3>
              <p>AI finds the best answers from your knowledge base, providing accurate information quickly.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span>🔄</span>
              </div>
              <h3>Smart Auto-Routing</h3>
              <p>Internal questions reach the right department or expert instantly without manual forwarding.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span>👥</span>
              </div>
              <h3>Human + AI Collaboration</h3>
              <p>AI handles routine tasks while your experts focus on complex inquiries requiring human touch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2>How SupportHub Works</h2>
          <p className="section-subtitle">A simple yet powerful approach to customer and internal support</p>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>AI Handles Customer Questions</h3>
                <p>Provides instant responses directly on your site to common customer inquiries.</p>
              </div>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Smart Search Feature</h3>
                <p>AI scans your knowledge base for the most relevant answers using advanced algorithms.</p>
              </div>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Seamless Escalation</h3>
                <p>If AI can't answer, it smartly escalates to the right human expert in your organization.</p>
              </div>
            </div>
            
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Internal Routing</h3>
                <p>Business teams benefit too - internal inquiries are auto-routed to the right people.</p>
              </div>
            </div>
            
            <div className="step-card">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Continuous Learning</h3>
                <p>AI learns and improves over time - the more it's used, the smarter it gets.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Use Section */}
      <section className="audience-section">
        <div className="container">
          <h2>Who Should Use SupportHub?</h2>
          <p className="section-subtitle">Perfect for organizations looking to enhance their support efficiency</p>
          
          <div className="audience-grid">
            <div className="audience-card">
              <span class="audience-icon">🚀</span>
              <h3>Businesses Seeking 24/7 Support</h3>
              <p>Companies looking to provide round-the-clock customer service without staffing overnight.</p>
            </div>
            
            <div className="audience-card">
              <span class="audience-icon">🎯</span>
              <h3>Customer Support Teams</h3>
              <p>Teams wanting to reduce repetitive inquiries and focus on more complex customer needs.</p>
            </div>
            
            <div className="audience-card">
              <span class="audience-icon">🏢</span>
              <h3>Internal Operations</h3>
              <p>Project managers and business operations teams streamlining internal knowledge sharing.</p>
            </div>
            
            <div className="audience-card">
              <span class="audience-icon">📈</span>
              <h3>Growing Companies</h3>
              <p>Businesses of all sizes looking to scale their support efforts without proportional costs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2>Why Businesses Love SupportHub</h2>
          <p className="section-subtitle">Tangible benefits that transform your support operations</p>
          
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <div className="benefit-content">
                <h3>Reduce Support Tickets</h3>
                <p>AI instantly resolves common questions, decreasing ticket volume by up to 50%.</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <div className="benefit-content">
                <h3>Improve Customer Experience</h3>
                <p>Faster responses mean happier users, with 24/7 support availability.</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <div className="benefit-content">
                <h3>Save Time & Resources</h3>
                <p>Free up your team from repetitive tasks to focus on high-value activities.</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <div className="benefit-content">
                <h3>Effortless Setup & Use</h3>
                <p>Add the widget with simple instructions or let our team help with implementation.</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <span className="check-icon">✓</span>
              <div className="benefit-content">
                <h3>Cost-Effective & Scalable</h3>
                <p>Grows with your business needs without proportional cost increases.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bottom-cta-section">
        <div className="container">
          <h2>Start Automating Your Website Support Today!</h2>
          <p>Join thousands of businesses already using SupportHub</p>
          <div className="cta-buttons">
            {!isLogin ? (
              <Link to="/signup" className="cta-button primary large">
                <span className="btn-inner">
                  <span className="btn-normal-text">Get AI-Powered Support Now</span>
                  <span className="btn-hover-text">Get AI-Powered Support Now</span>
                </span>
              </Link>
            ) : (
              <Link to="/business-overview" className="cta-button primary large">
                <span className="btn-inner">
                  <span className="btn-normal-text">Explore Dashboard</span>
                  <span className="btn-hover-text">Explore Dashboard</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={logo} alt="Support Hub Logo" />
              <p>The complete AI platform for business support</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Support Hub</h4>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Careers</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">API Reference</a></li>
                  <li><a href="#">Blog</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Support Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage; 