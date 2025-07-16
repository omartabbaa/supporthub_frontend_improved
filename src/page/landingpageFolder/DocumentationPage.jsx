import React, { useState, useEffect } from 'react';
import FooterOne from './ComponentsLandingPage/FooterOne';
import './ComponentsLandingPage/documentation.css';
import { useSidebarContext } from '../../context/SidebarContext.jsx';

const DocumentationPage = () => {
  const { setActiveSidebarType } = useSidebarContext();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveSidebarType('userActions');
  }, [setActiveSidebarType]);

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
      title: 'Widget Implementation',
      content: `
        <h1>How to Add SupportHub Widget to Your Website</h1>
        <p>Adding the SupportHub AI chat widget to your website is simple and takes just a few minutes. Follow this step-by-step guide to get your support widget up and running.</p>
        
        <h2>📋 Prerequisites</h2>
        <div class="prerequisites-checklist">
          <ul>
            <li>✅ A SupportHub account (admin access required)</li>
            <li>✅ Your business set up in SupportHub</li>
            <li>✅ Access to your website's HTML code</li>
            <li>✅ Basic knowledge of copy/paste code</li>
          </ul>
        </div>

        <h2>🚀 Step-by-Step Implementation</h2>
        
        <div class="implementation-steps">
          <div class="step-box">
            <h3>Step 1: Configure Your AI (5 minutes)</h3>
            <ol>
              <li>Log into your SupportHub dashboard</li>
              <li>Click the <strong>"Widget"</strong> tab in the sidebar</li>
              <li>Go to <strong>"AI Personalization"</strong></li>
              <li>Set up your AI's name, personality, and responses</li>
              <li>Add your company overview to help the AI understand your business</li>
              <li>Click <strong>"Save Configuration"</strong></li>
            </ol>
            <p><em>💡 Tip: Take time to write a good personality description - this helps your AI give more relevant answers!</em></p>
          </div>

          <div class="step-box">
            <h3>Step 2: Design Your Widget (3 minutes)</h3>
            <ol>
              <li>Stay in the Widget tab and go to <strong>"Widget Designer"</strong></li>
              <li>Customize the appearance to match your brand:</li>
              <ul>
                <li><strong>Colors:</strong> Set primary color (usually your brand color)</li>
                <li><strong>Position:</strong> Choose where the widget appears (bottom-right is most common)</li>
                <li><strong>Messages:</strong> Write a welcoming header and greeting</li>
                <li><strong>Style:</strong> Pick rounded or square corners</li>
              </ul>
              <li>Preview your changes in the live preview on the right</li>
              <li>Click <strong>"Save Configuration"</strong> when happy with the design</li>
            </ol>
          </div>

          <div class="step-box">
            <h3>Step 3: Get Your Widget Code (2 minutes)</h3>
            <ol>
              <li>Go to <strong>"Widget Integration"</strong> in the Widget tab</li>
              <li>If you don't have an API key yet:
                <ul>
                  <li>Go to Admin Dashboard → API Key Manager</li>
                  <li>Click "Generate API Key"</li>
                  <li>Copy and save your API key securely</li>
                </ul>
              </li>
              <li>Back in Widget Integration, select your API key from the dropdown</li>
              <li>Copy the generated script code (it looks like this):</li>
            </ol>
            <div class="code-example">
              <pre><code>&lt;!-- SupportHub Widget --&gt;
&lt;script 
  src="http://localhost:5175/widget.js"
  data-api-key="YOUR_API_KEY_HERE"
  data-business-id="YOUR_BUSINESS_ID"
  async
  defer&gt;
&lt;/script&gt;</code></pre>
            </div>
          </div>

          <div class="step-box">
            <h3>Step 4: Add Code to Your Website (5 minutes)</h3>
            
            <h4>🌐 For WordPress Users:</h4>
            <ol>
              <li>Go to your WordPress admin dashboard</li>
              <li>Navigate to <strong>Appearance → Theme Editor</strong></li>
              <li>Open your theme's <strong>footer.php</strong> file</li>
              <li>Paste the script code just before the closing <code>&lt;/body&gt;</code> tag</li>
              <li>Click <strong>"Update File"</strong></li>
            </ol>

            <h4>💻 For HTML/Custom Websites:</h4>
            <ol>
              <li>Open your website's HTML files</li>
              <li>Find the <code>&lt;/body&gt;</code> closing tag</li>
              <li>Paste the script code just before it</li>
              <li>Save and upload your files to your web server</li>
            </ol>

            <h4>⚛️ For React/Vue/Angular Apps:</h4>
            <ol>
              <li>Add the script to your main <code>index.html</code> file in the public folder</li>
              <li>Or use a script loader component to dynamically load it</li>
              <li>Make sure it loads after your app initializes</li>
            </ol>

            <h4>🛒 For E-commerce Platforms:</h4>
            <ul>
              <li><strong>Shopify:</strong> Go to Online Store → Themes → Actions → Edit Code → theme.liquid</li>
              <li><strong>WooCommerce:</strong> Follow the WordPress instructions above</li>
              <li><strong>Magento:</strong> Add to your theme's footer template</li>
            </ul>
          </div>
        </div>

        <h2>✅ Testing Your Widget</h2>
        <div class="testing-section">
          <ol>
            <li>Visit your website in a new browser tab</li>
            <li>Look for the chat widget (usually in the bottom-right corner)</li>
            <li>Click on the widget to open the chat</li>
            <li>Send a test message like "Hello" or "What are your business hours?"</li>
            <li>Verify the AI responds appropriately</li>
          </ol>
          
          <div class="troubleshooting">
            <h3>🔧 Not Working? Try These Solutions:</h3>
            <ul>
              <li><strong>Widget not appearing:</strong> Check if the script is in the right location (before &lt;/body&gt;)</li>
              <li><strong>Script errors:</strong> Verify your API key and business ID are correct</li>
              <li><strong>No AI responses:</strong> Ensure your AI is configured in the dashboard</li>
              <li><strong>Styling issues:</strong> Check for CSS conflicts with your website's styles</li>
            </ul>
          </div>
        </div>

        <h2>⚙️ Advanced Configuration</h2>
        <div class="advanced-config">
          <h3>Custom Positioning</h3>
          <p>You can modify the widget's position by adding CSS to your website:</p>
          <pre><code>/* Move widget to bottom-left */
.support-widget {
  bottom: 20px !important;
  left: 20px !important;
  right: auto !important;
}

/* Change widget size */
.support-widget {
  width: 350px !important;
  height: 500px !important;
}</code></pre>

          <h3>Department-Specific Widgets</h3>
          <p>You can create different widgets for different sections of your website by:</p>
          <ul>
            <li>Setting up multiple departments in SupportHub</li>
            <li>Using different API keys for each department</li>
            <li>Customizing the AI personality for each use case</li>
          </ul>
        </div>

        <h2>📊 Monitor Performance</h2>
        <p>After implementation, monitor your widget's performance in the SupportHub dashboard:</p>
        <ul>
          <li><strong>Analytics:</strong> Track conversations, response times, and satisfaction</li>
          <li><strong>Questions:</strong> Review common questions to improve your AI training</li>
          <li><strong>Expert Activity:</strong> See when human experts need to step in</li>
        </ul>

        <div class="success-banner">
          <h3>🎉 Congratulations!</h3>
          <p>Your SupportHub widget is now live! Your customers can get instant AI-powered support 24/7, and complex questions will be routed to your expert team members.</p>
        </div>
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
    <div className="documentation-container">
      <header className="documentation-header">
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
      </header>

      {/* Documentation Content */}
      <div className={`doc-content container`}>
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