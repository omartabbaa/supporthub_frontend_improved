import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { agentQuestions as agentQuestionsApi } from '../services/ApiService';
import SideNavbar from '../Components/SideNavbar';
import './AgentAnalyticsPage.css';

const AgentAnalyticsPage = () => {
  const { userId, role } = useUserContext();
  const navigate = useNavigate();
  
  const [counts, setCounts] = useState(null);
  const [timing, setTiming] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch counts and timing data in parallel
        const [countsResponse, timingResponse] = await Promise.all([
          agentQuestionsApi.getCountsForUser(userId),
          agentQuestionsApi.getTimingForUser(userId)
        ]);
        
        setCounts(countsResponse.data);
        setTiming(timingResponse.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className={`agent-analytics-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <SideNavbar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`agent-analytics-content ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
        <div className="help-mode-toggle-container">
          <span className="help-mode-label">Help Mode</span>
          <button 
            className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
            onClick={() => setHelpModeEnabled(!helpModeEnabled)}
            data-tooltip="Toggle help tooltips on/off"
            data-tooltip-position="left"
          >
            <div className="help-mode-toggle-circle"></div>
            <span className="sr-only">Toggle help mode</span>
          </button>
        </div>

        <header className="page-header">
          <h1>My Performance Analytics</h1>
        </header>

        {isLoading ? (
          <div className="loading-container">
            <p>Loading analytics data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        ) : (
          <div className="analytics-dashboard">
            {counts && (
              <section className="analytics-section question-stats">
                <h2>Question Statistics</h2>
                <div className="stats-cards">
                  <div className="stats-card">
                    <div className="stats-value">{counts.totalQuestions || 0}</div>
                    <div className="stats-label">Total Questions</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-value">{counts.answeredQuestions || 0}</div>
                    <div className="stats-label">Answered</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-value">{counts.unansweredQuestions || 0}</div>
                    <div className="stats-label">Unanswered</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-value">{counts.projectCount || 0}</div>
                    <div className="stats-label">Projects</div>
                  </div>
                </div>
              </section>
            )}
            
            {timing && (
              <section className="analytics-section response-stats">
                <h2>Response Time Performance</h2>
                <div className="stats-cards">
                  <div className="stats-card">
                    <div className="stats-value">{timing.totalAnsweredCount || 0}</div>
                    <div className="stats-label">Answers Provided</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-value">{formatTime(timing.averageResponseTimeMinutes)}</div>
                    <div className="stats-label">Average Response Time</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-value">{formatTime(timing.fastestResponseTimeMinutes)}</div>
                    <div className="stats-label">Fastest Response</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-value">{formatTime(timing.slowestResponseTimeMinutes)}</div>
                    <div className="stats-label">Slowest Response</div>
                  </div>
                </div>
                
                <div className="time-period-info">
                  <div className="time-period-item">
                    <span className="metadata-label">First Answer:</span>
                    <span className="metadata-value">{formatDate(timing.oldestAnswerDate)}</span>
                  </div>
                  <div className="time-period-item">
                    <span className="metadata-label">Latest Answer:</span>
                    <span className="metadata-value">{formatDate(timing.newestAnswerDate)}</span>
                  </div>
                </div>
              </section>
            )}
            
            {timing && timing.details && timing.details.length > 0 && (
              <section className="analytics-section response-details">
                <h2>Response Details</h2>
                
                <div className="response-table-container">
                  <table className="response-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Project</th>
                        <th>Asked</th>
                        <th>Answered</th>
                        <th>Response Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timing.details.map((detail, index) => (
                        <tr key={index}>
                          <td className="question-col">{detail.questionTitle}</td>
                          <td>{detail.projectName || "N/A"}</td>
                          <td>{formatDate(detail.questionCreatedAt)}</td>
                          <td>{formatDate(detail.answerCreatedAt)}</td>
                          <td>{formatTime(detail.responseTimeMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentAnalyticsPage; 