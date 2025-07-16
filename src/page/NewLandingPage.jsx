import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from "../context/LoginContext";
import { subscriptionPlans } from '../services/ApiService';
import './NewLandingPage.css';
import logo from '../assets/Logo/navbarLogo.png';

const NewLandingPage = () => {
  const { isLogin, role } = useUserContext();
  
  // Counter effect for statistics
  const statsRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  
  // Pricing plans state
  const [pricingPlans, setPricingPlans] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState(null);

  // Interactive state
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Fetch pricing plans
  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        setPricingLoading(true);
        setPricingError(null);
        console.log('Fetching pricing plans...');
        const response = await subscriptionPlans.getAll(true, 'price');
        console.log('Pricing plans response:', response);
        console.log('Response data:', response.data);
        console.log('Data length:', response.data?.length);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setPricingPlans(response.data);
          console.log('Pricing plans set successfully:', response.data);
        } else {
          console.log('No pricing plans found, will show fallback');
          setPricingPlans([]);
        }
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
        console.error('Error details:', error.response?.data || error.message);
        setPricingError('Failed to load pricing plans');
        setPricingPlans([]); // Ensure empty array to trigger fallback
      } finally {
        setPricingLoading(false);
        console.log('Pricing loading finished');
      }
    };

    fetchPricingPlans();
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-rotate active feature
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatBillingInterval = (interval) => {
    switch (interval) {
      case 'MONTHLY':
        return 'month';
      case 'YEARLY':
        return 'year';
      case 'QUARTERLY':
        return 'quarter';
      default:
        return interval.toLowerCase();
    }
  };

  const formatLimitValue = (value) => {
    return value === -1 ? 'Unlimited' : value;
  };

  // Enhanced counter animation
  useEffect(() => {
    let isAnimated = false;
    
    function animateCounters() {
      if (!isAnimated) {
        const counterItems = document.querySelectorAll(".counter");
        counterItems.forEach((item) => {
          const targetValue = +item.getAttribute("data-target");
          let currentValue = 0;
          const increment = targetValue / 60; // Slower animation
          
          const updateCounter = () => {
            if (currentValue < targetValue) {
              currentValue += increment;
              item.textContent = Math.ceil(currentValue);
              setTimeout(updateCounter, 16); // 60fps
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

  // Scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechFlow",
      avatar: "👩‍💼",
      content: "SupportHub reduced our support ticket volume by 60%. The AI is incredibly smart and our customers love the instant responses.",
      rating: 5
    },
    {
      name: "Mike Rodriguez", 
      role: "Customer Success Manager",
      avatar: "👨‍💻",
      content: "Implementation was seamless and the results were immediate. Our team can now focus on complex issues while AI handles the routine questions.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Startup Founder",
      avatar: "👩‍🚀",
      content: "As a small team, we needed 24/7 support without the overhead. SupportHub delivered exactly that and more.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "How quickly can I set up SupportHub?",
      answer: "Most customers are up and running within 15 minutes. Our setup wizard guides you through connecting your knowledge base and customizing the AI responses."
    },
    {
      question: "Does SupportHub work with my existing tools?",
      answer: "Yes! SupportHub integrates seamlessly with popular platforms like Slack, Discord, websites, and most customer service tools through our API."
    },
    {
      question: "How accurate are the AI responses?",
      answer: "Our AI achieves 95%+ accuracy by learning from your specific knowledge base. It gets smarter over time and knows when to escalate to human experts."
    },
    {
      question: "Can I customize the AI's personality?",
      answer: "Absolutely! You can adjust the tone, style, and personality to match your brand. From professional to friendly to technical - it's all customizable."
    },
    {
      question: "What happens if the AI can't answer?",
      answer: "Smart escalation! The AI seamlessly routes complex questions to the right human expert in your organization, with full context included."
    }
  ];

  return (
    <div className="new-landing-page">
      {/* Cursor follower */}
      <div 
        className="cursor-follower"
        style={{
          left: mousePosition.x,
          top: mousePosition.y
        }}
      />

      {/* Enhanced Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-background">
          <div className="floating-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
          <div className="grid-overlay"></div>
        </div>
        
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <div className="hero-content animate-on-scroll">
                <div className="hero-badge-container">
                  <span className="hero-badge-new">
                    <span className="pulse-dot"></span>
                    🚀 AI-Powered Support Revolution
                  </span>
                </div>
                <h1 className="hero-title">
                  Transform Customer Support with
                  <span className="gradient-text"> Intelligent AI</span>
                </h1>
                <p className="hero-subtitle">
                  Deploy a 24/7 AI assistant that learns your business, answers instantly, and seamlessly collaborates with your human experts. Watch your customer satisfaction soar while reducing support costs by up to 70%.
                </p>
                
                <div className="hero-stats">
                  <div className="stat-item">
                    <span className="stat-number">95%</span>
                    <span className="stat-label">Accuracy Rate</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">&lt; 2s</span>
                    <span className="stat-label">Response Time</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">24/7</span>
                    <span className="stat-label">Availability</span>
                  </div>
                </div>

                <div className="cta-buttons">
                  {!isLogin ? (
                    <>
                      <Link to="/signup" className="cta-button primary enhanced">
                        <span className="btn-inner">
                          <span className="btn-icon">🚀</span>
                          <span className="btn-text">Start Free Trial</span>
                          <span className="btn-subtext">No credit card required</span>
                        </span>
                        <div className="btn-glow"></div>
                      </Link>
                      <Link to="/login" className="cta-button secondary enhanced">
                        <span className="btn-inner">
                          <span className="btn-icon">🔑</span>
                          <span className="btn-text">Sign In</span>
                        </span>
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to={role === "ROLE_ADMIN" ? "/admin-dashboard" : "/business-overview"} 
                      className="cta-button primary enhanced"
                    >
                      <span className="btn-inner">
                        <span className="btn-icon">⚡</span>
                        <span className="btn-text">Go to Dashboard</span>
                      </span>
                      <div className="btn-glow"></div>
                    </Link>
                  )}
                </div>

                <div className="trust-indicators">
                  <span className="trust-text">Trusted by 10,000+ businesses</span>
                  <div className="trust-badges">
                    <span className="trust-badge">⭐ 4.9/5 Rating</span>
                    <span className="trust-badge">🔒 SOC 2 Compliant</span>
                    <span className="trust-badge">🛡️ GDPR Ready</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="hero-image animate-on-scroll">
                <div className="demo-container">
                  <div className="demo-window">
                    <div className="demo-header">
                      <div className="demo-controls">
                        <span className="control red"></span>
                        <span className="control yellow"></span>
                        <span className="control green"></span>
                      </div>
                      <span className="demo-title">AI Assistant Live Demo</span>
                    </div>
                    <div className="demo-content">
                      <div className="chat-message user">
                        <span className="avatar">👤</span>
                        <div className="message">How do I reset my password?</div>
                      </div>
                      <div className="chat-message ai">
                        <span className="avatar ai-avatar">🤖</span>
                        <div className="message">
                          I can help you reset your password! Here are the steps:
                          <ol>
                            <li>Click "Forgot Password" on the login page</li>
                            <li>Enter your email address</li>
                            <li>Check your email for reset link</li>
                          </ol>
                          <div className="response-time">⚡ Responded in 0.8s</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="floating-metrics">
                    <div className="metric">
                      <span className="metric-icon">📈</span>
                      <span className="metric-text">95% Satisfied</span>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">⚡</span>
                      <span className="metric-text">Instant Response</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Showcase */}
      <section className="features-showcase animate-on-scroll">
        <div className="container">
          <div className="section-header">
            <h2>Intelligent Features That Deliver Results</h2>
            <p>Discover how our AI transforms every aspect of customer support</p>
          </div>
          
          <div className="features-interactive">
            <div className="features-tabs">
              {[
                { icon: "🤖", title: "Smart AI Engine", description: "Advanced NLP understands context and intent" },
                { icon: "🔄", title: "Auto Routing", description: "Intelligent escalation to the right expert" },
                { icon: "📚", title: "Knowledge Learning", description: "Continuously learns from your content" },
                { icon: "🌐", title: "Multi-Platform", description: "Works across all your channels" }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className={`feature-tab ${activeFeature === index ? 'active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <span className="feature-tab-icon">{feature.icon}</span>
                  <div className="feature-tab-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="features-display">
              <div className="feature-visual">
                <div className={`feature-demo demo-${activeFeature + 1}`}>
                  <div className="demo-screen">
                    <div className="demo-animation">
                      {activeFeature === 0 && <div className="ai-brain">🧠</div>}
                      {activeFeature === 1 && <div className="routing-flow">📤➡️👨‍💼</div>}
                      {activeFeature === 2 && <div className="learning-cycle">📖🔄💡</div>}
                      {activeFeature === 3 && <div className="multi-platform">💬📱💻</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section animate-on-scroll">
        <div className="container">
          <div className="section-header">
            <h2>Loved by Teams Worldwide</h2>
            <p>See what our customers say about their SupportHub experience</p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <blockquote>{testimonial.content}</blockquote>
                <div className="testimonial-author">
                  <span className="avatar">{testimonial.avatar}</span>
                  <div className="author-info">
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="stats-section enhanced" ref={statsRef}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">⚡</div>
              <div className="stat-number">
                <span className="counter" data-target="75">0</span>%
              </div>
              <div className="stat-label">Cost Reduction</div>
              <div className="stat-description">Average savings on support costs</div>
            </div>
            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">😊</div>
              <div className="stat-number">
                <span className="counter" data-target="95">0</span>%
              </div>
              <div className="stat-label">Customer Satisfaction</div>
              <div className="stat-description">Users love instant AI responses</div>
            </div>
            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">🚀</div>
              <div className="stat-number">
                <span className="counter" data-target="300">0</span>%
              </div>
              <div className="stat-label">Efficiency Boost</div>
              <div className="stat-description">Faster resolution times</div>
            </div>
            <div className="stat-card animate-on-scroll">
              <div className="stat-icon">⏰</div>
              <div className="stat-number">
                <span className="counter" data-target="24">0</span>/7
              </div>
              <div className="stat-label">Always Available</div>
              <div className="stat-description">Never miss a customer query</div>
            </div>
          </div>
        </div>
      </section>

      {/* Existing Pricing Section with enhanced animation */}
      <section className="pricing-section animate-on-scroll" style={{ display: 'block', opacity: 1, visibility: 'visible' }}>
        <div className="container">
          <h2>Choose Your Plan</h2>
          <p className="section-subtitle">Select the perfect plan for your business needs</p>
          
          {/* Debug info */}
          <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px', color: '#666' }}>
            Debug: Loading: {pricingLoading.toString()}, Error: {pricingError || 'none'}, Plans Count: {pricingPlans.length}
          </div>
          
          {pricingLoading ? (
            <div className="pricing-loading" style={{ display: 'block', opacity: 1, visibility: 'visible' }}>
              <div className="loading-spinner"></div>
              <p>Loading pricing plans...</p>
            </div>
          ) : pricingError ? (
            <div className="pricing-error" style={{ display: 'block', opacity: 1, visibility: 'visible' }}>
              <p>{pricingError}</p>
              <p>Please try refreshing the page or contact support.</p>
            </div>
          ) : pricingPlans && pricingPlans.length > 0 ? (
            <div className="plans-list" style={{ display: 'flex', opacity: 1, visibility: 'visible' }}>
              {pricingPlans.map((plan, index) => {
                // Determine if this plan should be featured (Professional plan with $99 price)
                const isFeatured = plan.name?.toLowerCase().includes('professional') || 
                                 plan.price === 99 || 
                                 (plan.price > 50 && plan.price < 150);
                
                return (
                  <div key={plan.planId} className={`plan-item animate-on-scroll ${isFeatured ? 'featured' : ''}`} style={{ animationDelay: `${index * 0.1}s`, display: 'flex', opacity: 1, visibility: 'visible' }}>
                    {isFeatured && <div className="popular-badge">🔥 Most Popular</div>}
                    <div className="plan-header">
                      <h3>{plan.name}</h3>
                      <div className="plan-price">
                        <span className="price-amount">${plan.price}</span>
                        <span className="price-interval">per {formatBillingInterval(plan.billingInterval)}</span>
                      </div>
                    </div>
                    <p className="plan-description">{plan.description}</p>
                    
                    <div className="plan-details">
                      <div className="detail-row">
                        <span>Expert Seats:</span>
                        <span>{formatLimitValue(plan.maxExperts)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Departments:</span>
                        <span>{formatLimitValue(plan.maxDepartments)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Projects per Department:</span>
                        <span>{formatLimitValue(plan.maxProjectsPerDepartment)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Conversations:</span>
                        <span>{formatLimitValue(plan.maxConversations)}</span>
                      </div>
                    </div>

                    <Link 
                      to="/signup" 
                      className={`select-plan-button ${isFeatured ? 'featured-button' : ''}`}
                    >
                      Get Started - ${plan.price}/{formatBillingInterval(plan.billingInterval)}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            // Always show fallback content when API fails or returns no data
            <div className="pricing-fallback" style={{ display: 'block', opacity: 1, visibility: 'visible' }}>
              <div className="plans-list" style={{ display: 'flex', opacity: 1, visibility: 'visible' }}>
                <div className="plan-item animate-on-scroll" style={{ display: 'flex', opacity: 1, visibility: 'visible' }}>
                  <div className="plan-header">
                    <h3>Starter</h3>
                    <div className="plan-price">
                      <span className="price-amount">$29</span>
                      <span className="price-interval">per month</span>
                    </div>
                  </div>
                  <p className="plan-description">Perfect for small teams getting started with AI support</p>
                  
                  <div className="plan-details">
                    <div className="detail-row">
                      <span>Expert Seats:</span>
                      <span>5</span>
                    </div>
                    <div className="detail-row">
                      <span>Departments:</span>
                      <span>3</span>
                    </div>
                    <div className="detail-row">
                      <span>Projects per Department:</span>
                      <span>10</span>
                    </div>
                    <div className="detail-row">
                      <span>Conversations:</span>
                      <span>1,000</span>
                    </div>
                  </div>

                  <Link to="/signup" className="select-plan-button">
                    Get Started - $29/month
                  </Link>
                </div>

                <div className="plan-item animate-on-scroll featured" style={{ display: 'flex', opacity: 1, visibility: 'visible' }}>
                  <div className="popular-badge">🔥 Most Popular</div>
                  <div className="plan-header">
                    <h3>Professional</h3>
                    <div className="plan-price">
                      <span className="price-amount">$99</span>
                      <span className="price-interval">per month</span>
                    </div>
                  </div>
                  <p className="plan-description">Ideal for growing businesses with advanced support needs</p>
                  
                  <div className="plan-details">
                    <div className="detail-row">
                      <span>Expert Seats:</span>
                      <span>15</span>
                    </div>
                    <div className="detail-row">
                      <span>Departments:</span>
                      <span>10</span>
                    </div>
                    <div className="detail-row">
                      <span>Projects per Department:</span>
                      <span>50</span>
                    </div>
                    <div className="detail-row">
                      <span>Conversations:</span>
                      <span>10,000</span>
                    </div>
                  </div>

                  <Link to="/signup" className="select-plan-button featured-button">
                    Get Started - $99/month
                  </Link>
                </div>

                <div className="plan-item animate-on-scroll" style={{ display: 'flex', opacity: 1, visibility: 'visible' }}>
                  <div className="plan-header">
                    <h3>Enterprise</h3>
                    <div className="plan-price">
                      <span className="price-amount">$299</span>
                      <span className="price-interval">per month</span>
                    </div>
                  </div>
                  <p className="plan-description">Complete solution for large organizations with unlimited scale</p>
                  
                  <div className="plan-details">
                    <div className="detail-row">
                      <span>Expert Seats:</span>
                      <span>Unlimited</span>
                    </div>
                    <div className="detail-row">
                      <span>Departments:</span>
                      <span>Unlimited</span>
                    </div>
                    <div className="detail-row">
                      <span>Projects per Department:</span>
                      <span>Unlimited</span>
                    </div>
                    <div className="detail-row">
                      <span>Conversations:</span>
                      <span>Unlimited</span>
                    </div>
                  </div>

                  <Link to="/signup" className="select-plan-button">
                    Get Started - $299/month
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section animate-on-scroll">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about SupportHub</p>
          </div>
          
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button 
                  className={`faq-question ${activeFaq === index ? 'active' : ''}`}
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-toggle">
                    {activeFaq === index ? '−' : '+'}
                  </span>
                </button>
                <div className={`faq-answer ${activeFaq === index ? 'open' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rest of existing sections with enhanced styling... */}
      {/* How It Works Section */}
      <section className="how-it-works-section animate-on-scroll">
        <div className="container">
          <h2>How SupportHub Works</h2>
          <p className="section-subtitle">A simple yet powerful approach to customer and internal support</p>
          
          <div className="steps-container">
            {[
              {
                title: "AI Handles Customer Questions",
                description: "Provides instant responses directly on your site to common customer inquiries.",
                icon: "🤖"
              },
              {
                title: "Smart Search Feature", 
                description: "AI scans your knowledge base for the most relevant answers using advanced algorithms.",
                icon: "🔍"
              },
              {
                title: "Seamless Escalation",
                description: "If AI can't answer, it smartly escalates to the right human expert in your organization.",
                icon: "🔄"
              },
              {
                title: "Internal Routing",
                description: "Business teams benefit too - internal inquiries are auto-routed to the right people.",
                icon: "📤"
              },
              {
                title: "Continuous Learning",
                description: "AI learns and improves over time - the more it's used, the smarter it gets.",
                icon: "🧠"
              }
            ].map((step, index) => (
              <div key={index} className="step-card animate-on-scroll" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="bottom-cta-section enhanced">
        <div className="cta-background">
          <div className="cta-particles"></div>
        </div>
        <div className="container">
          <div className="cta-content animate-on-scroll">
            <h2>Ready to Transform Your Support?</h2>
            <p>Join thousands of businesses already using SupportHub to deliver exceptional customer experiences</p>
            <div className="cta-buttons">
              {!isLogin ? (
                <Link to="/signup" className="cta-button primary enhanced large">
                  <span className="btn-inner">
                    <span className="btn-icon">🚀</span>
                    <span className="btn-text">Start Your Free Trial</span>
                    <span className="btn-subtext">30 days free, no credit card</span>
                  </span>
                  <div className="btn-glow"></div>
                </Link>
              ) : (
                <Link to="/business-overview" className="cta-button primary enhanced large">
                  <span className="btn-inner">
                    <span className="btn-icon">⚡</span>
                    <span className="btn-text">Explore Dashboard</span>
                  </span>
                  <div className="btn-glow"></div>
                </Link>
              )}
            </div>
            <div className="cta-guarantee">
              <span className="guarantee-icon">🛡️</span>
              <span>30-day money-back guarantee • Cancel anytime • No setup fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="landing-footer enhanced">
        <div className="footer-background">
          <div className="footer-grid-pattern"></div>
        </div>
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={logo} alt="Support Hub Logo" />
              <p>The complete AI platform for business support</p>
              <div className="social-links">
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="LinkedIn">💼</a>
                <a href="#" aria-label="GitHub">⚡</a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <ul>
                  <li><a href="#">Features</a></li>
                  <li><a href="#">Pricing</a></li>
                  <li><a href="#">API</a></li>
                  <li><a href="#">Integrations</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Status</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#">Terms</a></li>
                  <li><a href="#">Privacy</a></li>
                  <li><a href="#">Security</a></li>
                  <li><a href="#">Cookies</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SupportHub. All rights reserved. Built with ❤️ for better customer experiences.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage; 