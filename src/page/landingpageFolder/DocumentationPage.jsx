import React, { useState } from 'react';
import FooterOne from './ComponentsLandingPage/FooterOne';
import './ComponentsLandingPage/documentation.css';
import SideNavbar from '../../Components/SideNavbar';

const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Documentation sections data
  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: `
        <h1>Getting Started with SupportHub</h1>
        <p>SupportHub is an AI-powered assistant designed to transform your customer support experience. This guide will help you get up and running with our platform quickly.</p>
        
        <h2>Quick Start Guide</h2>
        <ol>
          <li>
            <strong>Sign up for an account</strong>
            <p>Create your SupportHub account by clicking the "Sign Up" button in the top right corner of our homepage.</p>
          </li>
          <li>
            <strong>Create your first business</strong>
            <p>After logging in, you'll be prompted to create your business profile. This information helps us customize your experience.</p>
          </li>
          <li>
            <strong>Set up departments and projects</strong>
            <p>Organize your support structure by creating departments and projects that match your business needs.</p>
          </li>
          <li>
            <strong>Add your knowledge base</strong>
            <p>Start building your AI's knowledge by adding frequently asked questions and their answers.</p>
          </li>
        </ol>
      `
    },
    {
      id: 'integrations',
      title: 'Integrations',
      content: `
        <h1>Integrating SupportHub</h1>
        <p>SupportHub can be integrated with your existing websites and applications in multiple ways.</p>
        
        <h2>Website Widget</h2>
        <p>Add the SupportHub chat widget to your website with a simple code snippet:</p>
        <pre><code>&lt;script src="https://cdn.supporthub.ai/widget.js" 
  data-key="YOUR_API_KEY"&gt;&lt;/script&gt;</code></pre>
        
        <h2>API Integration</h2>
        <p>For deeper integration, use our comprehensive REST API:</p>
        <pre><code>curl -X POST https://api.supporthub.ai/v1/query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "How do I reset my password?"}'</code></pre>
      `
    },
    {
      id: 'customization',
      title: 'Customization',
      content: `
        <h1>Customizing Your SupportHub Experience</h1>
        <p>SupportHub offers extensive customization options to match your brand and specific needs.</p>
        
        <h2>Widget Appearance</h2>
        <p>Customize the chat widget to match your brand:</p>
        <ul>
          <li>Change colors and theme</li>
          <li>Add your logo</li>
          <li>Modify chat bubble size and position</li>
          <li>Create custom welcome messages</li>
        </ul>
        
        <h2>AI Behavior</h2>
        <p>Fine-tune how your AI assistant responds:</p>
        <ul>
          <li>Adjust the tone and personality</li>
          <li>Set up automatic escalation rules</li>
          <li>Configure business hours and availability messages</li>
        </ul>
      `
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      content: `
        <h1>Analytics and Reporting</h1>
        <p>Gain valuable insights into your customer support operations with our comprehensive analytics tools.</p>
        
        <h2>Dashboard Overview</h2>
        <p>Your dashboard provides at-a-glance metrics including:</p>
        <ul>
          <li>Total conversations</li>
          <li>Average response time</li>
          <li>Customer satisfaction rating</li>
          <li>AI resolution rate</li>
          <li>Common topics and questions</li>
        </ul>
        
        <h2>Custom Reports</h2>
        <p>Create detailed reports based on specific criteria:</p>
        <ul>
          <li>Performance by department or project</li>
          <li>Time-based analysis (hourly, daily, weekly)</li>
          <li>Agent performance metrics</li>
          <li>Knowledge gap identification</li>
        </ul>
      `
    },
    {
      id: 'faqs',
      title: 'FAQs',
      content: `
        <h1>Frequently Asked Questions</h1>
        
        <h3>What devices does SupportHub work on?</h3>
        <p>SupportHub works on all modern devices including desktops, laptops, tablets, and mobile phones. Our responsive design ensures optimal experience across all screen sizes.</p>
        
        <h3>How does SupportHub handle sensitive data?</h3>
        <p>SupportHub is designed with security in mind. We use enterprise-grade encryption for all data, both in transit and at rest. You can also configure data retention policies to comply with regulations like GDPR.</p>
        
        <h3>Can I export my data from SupportHub?</h3>
        <p>Yes, SupportHub allows you to export all your data including conversation history, analytics, and knowledge base content in standard formats like CSV and JSON.</p>
        
        <h3>Does SupportHub support multiple languages?</h3>
        <p>Yes, SupportHub's AI can understand and respond in over 30 languages, making it ideal for global businesses.</p>
      `
    }
  ];

  // Filter sections based on search
  const filteredSections = searchQuery
    ? sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  return (
    <div className={`documentation-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <SideNavbar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Documentation Header */}
      <div className="doc-header">
        <div className="container">
          <h1>SupportHub Documentation</h1>
          <p>Everything you need to know about using SupportHub effectively</p>
          <div className="doc-search">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Documentation Content */}
      <div className={`doc-content container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar */}
        <div className="doc-sidebar">
          <nav>
            <ul>
              {filteredSections.map(section => (
                <li 
                  key={section.id} 
                  className={activeSection === section.id ? 'active' : ''}
                >
                  <button onClick={() => setActiveSection(section.id)}>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="doc-main">
          {filteredSections.map(section => (
            <div 
              key={section.id} 
              className={`doc-section ${activeSection === section.id ? 'active' : ''}`}
            >
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="no-results">
              <h2>No results found</h2>
              <p>Try adjusting your search query or browse the documentation using the sidebar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick help section */}
      <div className="quick-help">
        <div className="container">
          <h2>Need more help?</h2>
          <div className="help-options">
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h3>Chat Support</h3>
              <p>Talk to our support team for immediate assistance</p>
              <button className="help-button">Start Chat</button>
            </div>
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </div>
              <h3>Community</h3>
              <p>Join our community forum for tips and discussions</p>
              <button className="help-button">Visit Community</button>
            </div>
            <div className="help-card">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3>Video Tutorials</h3>
              <p>Watch step-by-step video guides for SupportHub</p>
              <button className="help-button">Watch Videos</button>
            </div>
          </div>
        </div>
      </div>

      <FooterOne />
    </div>
  );
};

export default DocumentationPage; 