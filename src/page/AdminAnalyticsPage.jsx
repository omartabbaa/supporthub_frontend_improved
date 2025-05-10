import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { agentQuestions as agentQuestionsApi, users as usersApi, projects as projectsApi, conversations as conversationsApi } from '../services/ApiService';
import SideNavbar from '../Components/SideNavbar';
import './AdminAnalyticsPage.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';

const AdminAnalyticsPage = () => {
  const { userId, role, stateBusinessId } = useUserContext();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessApiAvailable, setBusinessApiAvailable] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState('agent');
  
  // New state for AI agent analytics
  const [showAiAgentAnalytics, setShowAiAgentAnalytics] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationAnalytics, setConversationAnalytics] = useState(null);
  const [conversationPeriod, setConversationPeriod] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationError, setConversationError] = useState(null);
  
  // Separate state for agent-specific and business-wide analytics
  const [agentAnalytics, setAgentAnalytics] = useState({
    counts: null,
    timing: null,
    error: null,
    loading: false
  });
  
  // Business stats
  const [businessStats, setBusinessStats] = useState({
    counts: null,
    timing: null,
    error: null
  });
  
  // Use refs to track aggregation state instead of state variables
  const isAggregatingRef = useRef(false);
  const hasAggregatedRef = useRef(false);
  const prevUsersLengthRef = useRef(0);

  // Add period selector for time-based analytics
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Add state for agent comparison
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  
  // Calculate time-based metrics from the agent's detailed data
  const timeBasedMetrics = useMemo(() => {
    if (!agentAnalytics.timing || !agentAnalytics.timing.details) {
      return null;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of the week (Sunday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter details by time period
    const details = agentAnalytics.timing.details;
    
    // Group answers by period
    const todayAnswers = details.filter(d => new Date(d.answerCreatedAt) >= today);
    const weekAnswers = details.filter(d => new Date(d.answerCreatedAt) >= weekStart);
    const monthAnswers = details.filter(d => new Date(d.answerCreatedAt) >= monthStart);
    
    // Calculate metrics for each period
    const calculateMetrics = (answers) => {
      if (answers.length === 0) return { count: 0, avgTime: 0 };
      
      const totalTime = answers.reduce((sum, answer) => sum + (answer.responseTimeMinutes || 0), 0);
      return {
        count: answers.length,
        avgTime: totalTime / answers.length
      };
    };
    
    return {
      today: calculateMetrics(todayAnswers),
      week: calculateMetrics(weekAnswers),
      month: calculateMetrics(monthAnswers),
      all: calculateMetrics(details)
    };
  }, [agentAnalytics.timing]);
  
  // Generate agent comparison data
  useEffect(() => {
    if (showComparison && users.length > 0 && businessStats.timing) {
      const generateComparisonData = async () => {
        try {
          // Collect all agents' response times
          const agentPerformance = [];
          
          for (const user of users) {
            try {
              const timingResponse = await agentQuestionsApi.getTimingForUser(user.userId);
              const timing = timingResponse.data;
              
              if (timing && timing.averageResponseTimeMinutes) {
                agentPerformance.push({
                  userId: user.userId,
                  name: user.name,
                  avgResponseTime: timing.averageResponseTimeMinutes,
                  totalAnswers: timing.details?.length || 0
                });
              }
            } catch (error) {
              console.log(`Could not fetch timing for user ${user.userId}`);
            }
          }
          
          // Sort by average response time
          agentPerformance.sort((a, b) => a.avgResponseTime - b.avgResponseTime);
          
          // Find current agent's rank
          const selectedAgentRank = agentPerformance.findIndex(a => a.userId === parseInt(selectedUserId));
          
          setComparisonData({
            agents: agentPerformance,
            selectedAgentRank: selectedAgentRank !== -1 ? selectedAgentRank + 1 : null,
            totalAgents: agentPerformance.length,
            companyAvg: businessStats.timing.averageResponseTimeMinutes
          });
        } catch (error) {
          console.error('Error generating comparison data:', error);
        }
      };
      
      generateComparisonData();
    }
  }, [showComparison, users, selectedUserId, businessStats.timing]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fetch all users belonging to the business
  useEffect(() => {
    if (!userId || (role !== 'ROLE_ADMIN' && role !== 'ADMIN')) {
      navigate('/login');
      return;
    }
    
    const fetchUsers = async () => {
      try {
        console.log('Fetching users for business ID:', stateBusinessId);
        
        const response = await usersApi.getByBusinessId(stateBusinessId);
        
        const agentUsers = response.data.filter(user => {
          const userRole = user.role?.toUpperCase();
          return userRole === 'ROLE_USER' || userRole === 'USER' || 
                 userRole === 'ROLE_SUPPORT_AGENT' || userRole === 'SUPPORT_AGENT';
        });
        
        console.log('Fetched agents:', agentUsers);
        
        setUsers(agentUsers);
        
        if (agentUsers.length > 0) {
          setSelectedUserId(agentUsers[0].userId);
        }
        
        // Reset our aggregation flags when users change
        hasAggregatedRef.current = false;
        prevUsersLengthRef.current = agentUsers.length;
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load agents. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [userId, stateBusinessId, role, navigate]);

  // Fix the agent analytics data loading function
  const loadAgentData = useCallback(async (agentId = selectedUserId) => {
    if (!agentId) return;
    
    setAgentAnalytics(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    
    try {
      // Extract the numeric part if the ID includes non-numeric values
      let numericId = agentId;
      if (typeof agentId === 'string') {
        // Extract only digits from the ID
        const matches = agentId.match(/\d+/);
        if (matches && matches[0]) {
          numericId = matches[0];
        }
      }
      
      console.log('Fetching analytics for specific agent ID:', numericId);
      
      // Use the numericId for API calls
      const countsPromise = agentQuestionsApi.getCountsForUser(numericId);
      const timingPromise = agentQuestionsApi.getTimingForUser(numericId);
      
      const [countsResponse, timingResponse] = await Promise.all([
        countsPromise,
        timingPromise
      ]);
      
      setAgentAnalytics({
        counts: countsResponse.data,
        timing: timingResponse.data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error(`Error fetching analytics for agent ${agentId}:`, error);
      setAgentAnalytics(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load agent analytics. Please try again.'
      }));
    }
  }, []);

  // Add a useEffect to call loadAgentData when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      loadAgentData(selectedUserId);
    }
  }, [selectedUserId, loadAgentData]);

  // Separate effect for business analytics
  useEffect(() => {
    // Only run if we have users and haven't already aggregated for this set of users
    if (users.length > 0 && !hasAggregatedRef.current && users.length === prevUsersLengthRef.current) {
      const aggregateBusinessAnalytics = async () => {
        // Skip if already aggregating
        if (isAggregatingRef.current) return;
        
        try {
          isAggregatingRef.current = true;
          console.log('Starting business analytics aggregation for', users.length, 'users');
          
          const analyticsPromises = users.map(user => {
            return Promise.all([
              agentQuestionsApi.getCountsForUser(user.userId),
              agentQuestionsApi.getTimingForUser(user.userId)
            ]);
          });
          
          const allAnalytics = await Promise.all(analyticsPromises);
          
          // Aggregate counts
          const aggregatedCounts = {
            totalQuestions: 0,
            answeredQuestions: 0,
            unansweredQuestions: 0
          };
          
          // Aggregate timing
          let allResponseTimes = [];
          let oldestAnswerDate = null;
          let newestAnswerDate = null;
          let allDetails = [];
          
          allAnalytics.forEach(([countsResponse, timingResponse]) => {
            const counts = countsResponse.data;
            const timing = timingResponse.data;
            
            // Aggregate counts
            aggregatedCounts.totalQuestions += counts.totalQuestions || 0;
            aggregatedCounts.answeredQuestions += counts.answeredQuestions || 0;
            aggregatedCounts.unansweredQuestions += counts.unansweredQuestions || 0;
            
            // Aggregate timing
            if (timing && timing.details) {
              timing.details.forEach(detail => {
                if (detail.responseTimeMinutes) {
                  allResponseTimes.push(detail.responseTimeMinutes);
                }
                
                // Update date ranges
                const answerDate = new Date(detail.answerCreatedAt);
                if (!oldestAnswerDate || answerDate < oldestAnswerDate) {
                  oldestAnswerDate = answerDate;
                }
                if (!newestAnswerDate || answerDate > newestAnswerDate) {
                  newestAnswerDate = answerDate;
                }
                
                allDetails.push(detail);
              });
            }
          });
          
          // Calculate aggregate timing stats
          const aggregatedTiming = {
            averageResponseTimeMinutes: 0,
            fastestResponseTimeMinutes: 0,
            slowestResponseTimeMinutes: 0,
            oldestAnswerDate: oldestAnswerDate?.toISOString(),
            newestAnswerDate: newestAnswerDate?.toISOString(),
            details: allDetails
          };
          
          if (allResponseTimes.length > 0) {
            aggregatedTiming.averageResponseTimeMinutes = allResponseTimes.reduce((acc, val) => acc + val, 0) / allResponseTimes.length;
            aggregatedTiming.fastestResponseTimeMinutes = Math.min(...allResponseTimes);
            aggregatedTiming.slowestResponseTimeMinutes = Math.max(...allResponseTimes);
          }
          
          setBusinessStats({
            counts: aggregatedCounts,
            timing: aggregatedTiming,
            error: null
          });
          
          setBusinessApiAvailable(true);
          console.log('Business analytics aggregation complete - ONE TIME ONLY');
          
          // Mark as completed so we don't do it again
          hasAggregatedRef.current = true;
        } catch (error) {
          console.error('Error aggregating business analytics:', error);
          setBusinessStats({
            counts: null,
            timing: null,
            error: 'Failed to aggregate business analytics. Please try again later.'
          });
          setBusinessApiAvailable(false);
        } finally {
          isAggregatingRef.current = false;
        }
      };
      
      aggregateBusinessAnalytics();
    }
  }, [users]);

  // Format time in hours and minutes from minutes
  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add these new state variables
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [allProjectStats, setAllProjectStats] = useState([]);

  // Ensure we're only loading business-specific projects
  useEffect(() => {
    if (stateBusinessId) {
      console.log(`Loading topics for business ID: ${stateBusinessId}`);
      const fetchBusinessProjects = async () => {
        try {
          // Explicitly use the business endpoint
          const response = await projectsApi.getByBusinessId(stateBusinessId);
          
          if (!response.data || response.data.length === 0) {
            console.log('No topics found for this business');
            setProjects([]);
            return;
          }
          
          // Map the ProjectsByBusinessResponse format
          const projectsData = response.data.map(project => ({
            id: project.projectId,
            name: project.name, // Note the field is 'name' not 'projectName'
            description: project.description,
            departmentId: project.departmentId,
            departmentName: project.departmentName
          }));
          
          console.log(`Loaded ${projectsData.length} topics for business`);
          setProjects(projectsData);
          
          // Now that we have the projects, get their stats
          if (projectsData.length > 0) {
            fetchAllProjectStats(projectsData);
          }
        } catch (error) {
          console.error('Error fetching business topics:', error);
          setError('Failed to load business topics');
          setProjects([]);
        }
      };
      
      fetchBusinessProjects();
    } else {
      console.log('No business ID available, cannot load topics');
      setProjects([]);
    }
  }, [stateBusinessId]);

  // Update the fetchProjectAnalytics function to handle the project ID format
  const fetchProjectAnalytics = async (projectId) => {
    if (!projectId) return;
    
    try {
      setProjectLoading(true);
      
      // Use the count endpoint that returns ProjectQuestionCountDTO
      const response = await agentQuestionsApi.getCountsForProject(projectId);
      const projectData = response.data;
      
      // Handle specific fields from the ProjectQuestionCountDTO
      setProjectStats({
        totalQuestions: projectData.totalQuestions || 0,
        answeredQuestions: projectData.answeredQuestions || 0,
        unansweredQuestions: projectData.unansweredQuestions || 0,
        projectId: projectData.projectId,
        projectName: projectData.projectName || '',
        departmentName: projectData.departmentName || ''
      });
      
      setProjectLoading(false);
    } catch (error) {
      console.error(`Error fetching topic analytics for topic ${projectId}:`, error);
      setProjectStats(null);
      setProjectLoading(false);
    }
  };

  // Update the fetchAllProjectStats function to handle the project format
  const fetchAllProjectStats = async (projectList) => {
    if (!projectList || projectList.length === 0) {
      console.log("No projects to fetch stats for");
      return;
    }
    
    try {
      // Get stats for each project
      const statsPromises = projectList.map(project => 
        agentQuestionsApi.getCountsForProject(project.id)
          .then(response => ({ 
            data: response.data, 
            success: true 
          }))
          .catch(err => {
            console.error(`Error fetching stats for topic ${project.id}: ${err.message}`);
            return { data: null, success: false };
          })
      );
      
      const statsResponses = await Promise.all(statsPromises);
      
      // Process the valid responses
      const validProjectStats = statsResponses
        .filter(response => response.success && response.data)
        .map(response => {
          const data = response.data;
          return {
            id: data.projectId,
            name: data.projectName || '',
            answered: data.answeredQuestions || 0,
            unanswered: data.unansweredQuestions || 0,
            total: data.totalQuestions || 0
          };
        })
        .sort((a, b) => b.total - a.total); // Sort by total questions
      
      console.log(`Processed stats for ${validProjectStats.length} topics`);
      setAllProjectStats(validProjectStats);
    } catch (error) {
      console.error('Error fetching all project stats:', error);
    }
  };

  // Add this function to analyze trend data
  const generatePerformanceTrends = useCallback(async () => {
    if (!users.length || !selectedUserId) return;
    
    setPerformanceLoading(true);
    
    try {
      // Collect data for all agents to enable comparison
      const agentData = [];
      
      for (const user of users) {
        try {
          const timingResponse = await agentQuestionsApi.getTimingForUser(user.userId);
          if (timingResponse.data && timingResponse.data.details && timingResponse.data.details.length > 0) {
            const details = timingResponse.data.details;
            
            // Organize data by month
            const monthlyData = {};
            details.forEach(detail => {
              if (!detail.answerCreatedAt) return;
              
              const date = new Date(detail.answerCreatedAt);
              const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
              
              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                  totalTime: 0,
                  count: 0,
                  month: date.toLocaleString('default', { month: 'short' }),
                  year: date.getFullYear()
                };
              }
              
              monthlyData[monthKey].totalTime += detail.responseTimeMinutes || 0;
              monthlyData[monthKey].count += 1;
            });
            
            // Calculate averages and format for chart
            const monthlySeries = Object.keys(monthlyData)
              .sort() // Sort chronologically
              .map(key => {
                const data = monthlyData[key];
                return {
                  month: `${data.month} ${data.year}`,
                  avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
                  count: data.count
                };
              });
            
            agentData.push({
              userId: user.userId,
              name: user.name,
              monthlyData: monthlySeries
            });
          }
        } catch (error) {
          console.log(`Could not fetch timing for user ${user.userId}`);
        }
      }
      
      setTrendData(agentData);
    } catch (error) {
      console.error('Error generating performance trends:', error);
    } finally {
      setPerformanceLoading(false);
    }
  }, [users, selectedUserId]);

  // Call this function when appropriate
  useEffect(() => {
    if (showComparison && users.length > 0) {
      generatePerformanceTrends();
    }
  }, [showComparison, users, generatePerformanceTrends]);

  // Add a useEffect that runs when a topic is selected
  useEffect(() => {
    if (selectedProject) {
      fetchProjectAnalytics(selectedProject);
    }
  }, [selectedProject]);

  // Replace trendsData and chart rendering with simpler table-based representation
  const renderAgentPerformance = () => {
    if (!timeBasedMetrics) return null;
    
    return (
      <div className="agent-performance-table">
        <h3>Agent Response Time Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Time Period</th>
              <th>Questions Answered</th>
              <th>Average Response Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Today</td>
              <td>{timeBasedMetrics.today.count}</td>
              <td>{formatTime(timeBasedMetrics.today.avgTime)}</td>
            </tr>
            <tr>
              <td>This Week</td>
              <td>{timeBasedMetrics.week.count}</td>
              <td>{formatTime(timeBasedMetrics.week.avgTime)}</td>
            </tr>
            <tr>
              <td>This Month</td>
              <td>{timeBasedMetrics.month.count}</td>
              <td>{formatTime(timeBasedMetrics.month.avgTime)}</td>
            </tr>
            <tr>
              <td>All Time</td>
              <td>{timeBasedMetrics.all.count}</td>
              <td>{formatTime(timeBasedMetrics.all.avgTime)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Add this function to make the topic bars clickable
  const handleTopicBarClick = (projectId) => {
    setSelectedProject(projectId.toString());
    // Scroll to the topic details section
    document.querySelector('.project-selector').scrollIntoView({ behavior: 'smooth' });
  };

  // Add function to load conversation data
  const loadConversations = useCallback(async () => {
    if (!stateBusinessId) return;
    
    setConversationsLoading(true);
    setConversationError(null);
    
    try {
      // Load conversations for the business
      const response = await conversationsApi.getByBusinessId(stateBusinessId);
      setConversations(response.data);
      
      // Load analytics data
      const analyticsResponse = await conversationsApi.getAnalytics(stateBusinessId, conversationPeriod);
      setConversationAnalytics(analyticsResponse.data);
    } catch (err) {
      console.error('Error fetching conversation data:', err);
      setConversationError('Failed to load AI conversation data. Please try again later.');
    } finally {
      setConversationsLoading(false);
    }
  }, [stateBusinessId, conversationPeriod]);
  
  // Load conversations when the AI analytics view is shown
  useEffect(() => {
    if (showAiAgentAnalytics && stateBusinessId) {
      loadConversations();
    }
  }, [showAiAgentAnalytics, stateBusinessId, loadConversations]);
  
  // View a single conversation
  const viewConversation = async (conversationId) => {
    setSelectedConversation(null);
    setConversationsLoading(true);
    
    try {
      const response = await conversationsApi.getById(conversationId);
      setSelectedConversation(response.data);
    } catch (err) {
      console.error(`Error fetching conversation ${conversationId}:`, err);
      setConversationError('Failed to load conversation details.');
    } finally {
      setConversationsLoading(false);
    }
  };
  
  // Add this new useEffect for AI conversations at the top level
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!stateBusinessId || !showAiAgentAnalytics) return;
      
      setConversationsLoading(true);
      setConversationError(null);
      
      try {
        // First, check if conversations endpoint works
        const conversationsResponse = await conversationsApi.getByBusinessId(stateBusinessId);
        setConversations(conversationsResponse.data || []);
        
        try {
          // Then try to get analytics (this may fail if endpoint isn't implemented)
          const analyticsResponse = await conversationsApi.getAnalytics(stateBusinessId, conversationPeriod);
          setConversationAnalytics(analyticsResponse.data);
        } catch (analyticsError) {
          console.error('Analytics endpoint unavailable:', analyticsError);
          // Don't set error - we'll show a limited view with just conversations
        }
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        setConversationError('Unable to load AI conversation data. The API may not be fully implemented yet.');
      } finally {
        setConversationsLoading(false);
      }
    };
    
    fetchConversationData();
  }, [stateBusinessId, showAiAgentAnalytics, conversationPeriod]);

  // Add these at the top level with your other state declarations
  const [conversationDetail, setConversationDetail] = useState(null);
  const [conversationDetailLoading, setConversationDetailLoading] = useState(false);
  const [conversationDetailError, setConversationDetailError] = useState(null);

  // Add this useEffect at the top level of your component
  useEffect(() => {
    const fetchConversationDetail = async () => {
      if (!selectedConversation?.conversationId) return;
      
      try {
        setConversationDetailLoading(true);
        setConversationDetailError(null);
        const response = await conversationsApi.getById(selectedConversation.conversationId);
        setConversationDetail(response.data);
      } catch (error) {
        console.error('Error fetching conversation detail:', error);
        setConversationDetailError('Failed to load conversation messages');
      } finally {
        setConversationDetailLoading(false);
      }
    };

    if (selectedConversation) {
      fetchConversationDetail();
    } else {
      // Reset conversation detail when no conversation is selected
      setConversationDetail(null);
    }
  }, [selectedConversation]);

  // Update the renderConversationDetail function to correctly display messages
  const renderConversationDetail = () => {
    return (
      <section className="conversation-detail-container">
        <div className="detail-header">
          <button className="back-button" onClick={() => setSelectedConversation(null)}>
            ← Back to Conversations
          </button>
          <h3>Conversation Detail</h3>
        </div>

        {conversationDetailLoading ? (
          <div className="loading-container">
            <p>Loading conversation...</p>
          </div>
        ) : conversationDetailError ? (
          <div className="error-container">
            <p>{conversationDetailError}</p>
            <button className="retry-button" onClick={() => 
              setSelectedConversation({...selectedConversation})}>
              Retry
            </button>
          </div>
        ) : conversationDetail ? (
          <div className="conversation-detail">
            <div className="conversation-metadata">
              <div className="metadata-item">
                <span className="metadata-label">Topic:</span>
                <span className="metadata-value">{conversationDetail.primaryTopic || 'General'}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Started:</span>
                <span className="metadata-value">{new Date(conversationDetail.startTime).toLocaleString()}</span>
              </div>
              {conversationDetail.endTime && (
                <div className="metadata-item">
                  <span className="metadata-label">Ended:</span>
                  <span className="metadata-value">{new Date(conversationDetail.endTime).toLocaleString()}</span>
                </div>
              )}
              <div className="metadata-item">
                <span className="metadata-label">Status:</span>
                <span className="metadata-value">
                  {conversationDetail.endTime ? 'Completed' : 'Active'}
                </span>
              </div>
            </div>

            <div className="conversation-messages">
              <h3>Conversation History</h3>
              <div className="messages-container">
                {selectedConversation.messages && selectedConversation.messages.map((message, index) => {
                  // Determine if we should show this message
                  const isUser = message.messageType === "USER";
                  const isPersonalizedAi = message.messageType === "PERSONALIZED_AI";
                  const isRegularAi = message.messageType === "AI";
                  
                  // Only show AI messages if they have a category or are personalized
                  const shouldDisplay = isUser || isPersonalizedAi || 
                    (isRegularAi && message.messageCategory);
                  
                  if (!shouldDisplay) return null;
                  
                  return (
                    <div 
                      key={message.messageId || `message-${index}`} 
                      className={`message ${isUser ? 'user-message' : 'ai-message'}`}
                    >
                      <div className="message-header">
                        <span className="message-sender">
                          {isUser ? 'User' : (isPersonalizedAi ? 'Support AI' : 'AI')}
                        </span>
                        <span className="message-time">
                          {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Unknown time'}
                        </span>
                      </div>
                      <div className="message-content">{message.message}</div>
                      {message.messageCategory && (
                        <div className="message-category">
                          {message.messageCategory.replace(/_/g, ' ').toLowerCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="no-data-message">Conversation details not available</p>
        )}
      </section>
    );
  };

  // Keep just one renderAiAgentAnalytics function
  const renderAiAgentAnalytics = () => {
    // If a conversation is selected, show its detail view
    if (selectedConversation) {
      return renderConversationDetail();
    }
    
    // Regular AI analytics view
    return (
      <section className="analytics-container">
        <div className="ai-analytics-container">
          <h3>AI Agent Conversations</h3>
          
          {conversationsLoading ? (
            <div className="loading-container">
              <p>Loading AI conversation data...</p>
            </div>
          ) : conversationError ? (
            <div className="error-container">
              <p>{conversationError}</p>
              <div className="api-status-message">
                <p>This feature requires the AI Conversation API to be available.</p>
                <p>Status: <span className="api-status-error">Endpoint Not Available</span></p>
              </div>
              <button 
                className="retry-button" 
                onClick={() => setShowAiAgentAnalytics(true)}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="time-period-selector">
                <label htmlFor="conversation-period">Time Period:</label>
                <select 
                  id="conversation-period"
                  value={conversationPeriod}
                  onChange={(e) => setConversationPeriod(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              {/* Display basic conversation stats */}
              <div className="ai-analytics-summary">
                <div className="analytics-card">
                  <h4>Total Conversations</h4>
                  <p className="analytics-value">{conversations.length}</p>
                </div>
                
                <div className="analytics-card">
                  <h4>Active Conversations</h4>
                  <p className="analytics-value">
                    {conversations.filter(c => !c.endTime).length}
                  </p>
                </div>
                
                <div className="analytics-card">
                  <h4>Completed Conversations</h4>
                  <p className="analytics-value">
                    {conversations.filter(c => c.endTime).length}
                  </p>
                </div>
                
                <div className="analytics-card">
                  <h4>Avg Messages Per Conversation</h4>
                  <p className="analytics-value">
                    {conversations.length > 0
                      ? (conversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0) / conversations.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
              </div>
              
              {/* Conversations table */}
              <div className="conversations-table-container">
                <h4>Recent Conversations</h4>
                
                {conversations.length === 0 ? (
                  <p className="no-data-message">No conversations found for this business</p>
                ) : (
                  <table className="conversations-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Start Time</th>
                        <th>Status</th>
                        <th>Topic</th>
                        <th>Messages</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.slice(0, 10).map((conversation, index) => (
                        <tr key={conversation.conversationId || `conversation-${index}`}>
                          <td>{conversation.conversationId ? conversation.conversationId.substring(0, 8) + '...' : 'N/A'}</td>
                          <td>{conversation.startTime ? new Date(conversation.startTime).toLocaleString() : 'Unknown'}</td>
                          <td>{conversation.endTime ? 'Completed' : 'Active'}</td>
                          <td>{conversation.primaryTopic || 'Unknown'}</td>
                          <td>{conversation.messages?.length || 0}</td>
                          <td>
                            <button 
                              className="view-details-button"
                              onClick={() => setSelectedConversation(conversation)}
                              title="View conversation details"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    );
  };

  // Add this function to render the agent response time chart
  const renderAgentResponseTimeChart = () => {
    if (!agentAnalytics?.timing?.details || agentAnalytics.timing.details.length === 0) {
      return null;
    }
    
    // Process data for the chart - show last 10 responses
    const chartData = agentAnalytics.timing.details
      .slice(0, 10)
      .map(detail => ({
        question: detail.questionTitle?.substring(0, 15) + '...',
        time: parseFloat(detail.responseTimeMinutes.toFixed(2)),
        date: new Date(detail.answerCreatedAt).toLocaleDateString()
      }))
      .reverse();
    
    return (
      <div className="analytics-chart-container">
        <h4>Recent Response Times</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="question" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} min`, 'Response time']} />
            <Line 
              type="monotone" 
              dataKey="time" 
              stroke="#3182ce" 
              strokeWidth={2}
              dot={{ stroke: '#3182ce', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Add this function to render a distribution chart
  const renderQuestionDistributionChart = () => {
    if (!agentAnalytics?.counts) {
      return null;
    }
    
    const data = [
      { name: 'Answered', value: agentAnalytics.counts.answered, color: '#3182ce' },
      { name: 'Unanswered', value: agentAnalytics.counts.unanswered, color: '#f59e0b' }
    ];
    
    return (
      <div className="analytics-chart-container">
        <h4>Questions Distribution</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} questions`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Add this function to render an agent comparison chart
  const renderAgentComparisonChart = () => {
    if (!comparisonData || !comparisonData.agents || comparisonData.agents.length === 0) {
      return null;
    }
    
    // Take top 5 agents for comparison
    const chartData = comparisonData.agents
      .slice(0, 5)
      .map(agent => ({
        name: agent.name?.split(' ')[0] || 'Agent', // Just use first name to save space
        responseTime: parseFloat(agent.avgResponseTime.toFixed(2)),
        answers: agent.totalAnswers
      }));
    
    return (
      <div className="analytics-chart-container">
        <h4>Top 5 Agents by Response Time</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 12 }} 
              width={60}
            />
            <Tooltip formatter={(value) => [`${value} min`, 'Avg. Response Time']} />
            <Bar 
              dataKey="responseTime" 
              fill="#3182ce" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Add this dashboard component within AdminAnalyticsPage
  const renderDashboardHeader = () => {
    // Calculate total tickets, open, closed from business data
    const totalTickets = businessStats?.counts?.total || 0;
    const closedTickets = businessStats?.counts?.answered || 0;
    const openTickets = businessStats?.counts?.unanswered || 0;
    const satisfactionRate = 88; // Placeholder, replace with actual data if available
    
    // Calculate percentages for comparison with previous period
    const closedChange = 4.3; // Placeholder, replace with calculated value
    const openChange = 1.7; // Placeholder, replace with calculated value
    const satisfactionChange = 2.4; // Placeholder, replace with calculated value
    
    return (
      <div className="dashboard-header">
        <div className="metric-cards">
          <div className="metric-card">
            <div className="metric-title">Total Tickets</div>
            <div className="metric-value">{totalTickets.toLocaleString()}</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-title">Closed Tickets</div>
            <div className="metric-value">{closedTickets.toLocaleString()}</div>
            <div className="metric-trend positive">
              <span className="trend-arrow">↑</span> {closedChange}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-title">Open Tickets</div>
            <div className="metric-value">{openTickets.toLocaleString()}</div>
            <div className="metric-trend positive">
              <span className="trend-arrow">↑</span> {openChange}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-title">Customer Satisfaction</div>
            <div className="metric-value">{satisfactionRate}%</div>
            <div className="metric-trend positive">
              <span className="trend-arrow">↑</span> {satisfactionChange}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add this function to create the tickets over time chart
  const renderTicketsOverTimeChart = () => {
    // Generate some sample data based on date ranges if not available
    const today = new Date();
    const timeData = Array(30).fill().map((_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (29 - i));
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // Create realistic looking data
      const closedBase = Math.floor(Math.random() * 50) + 150;
      const openBase = Math.floor(Math.random() * 30) + 50;
      
      return {
        date: dateStr,
        open: openBase,
        closed: closedBase
      };
    });
    
    return (
      <div className="chart-container">
        <h3>Tickets Over Time</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color open"></div>
            <span>Open</span>
          </div>
          <div className="legend-item">
            <div className="legend-color closed"></div>
            <span>Closed</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="open" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="closed" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Add this function to create the tickets by category chart
  const renderTicketsByCategoryChart = () => {
    // Use existing project stats if available, otherwise use sample data
    const categoryData = allProjectStats?.length > 0 
      ? allProjectStats.slice(0, 4).map(project => ({
          name: project.name,
          value: project.total
        }))
      : [
        { name: 'Technical Support', value: 45 },
        { name: 'Billing', value: 25 },
        { name: 'Account Management', value: 20 },
        { name: 'Other', value: 10 }
      ];
    
    const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    
    return (
      <div className="chart-container">
        <h3>Tickets by Category</h3>
        <div className="chart-with-legend">
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-chart-legend">
            {categoryData.map((entry, index) => (
              <div key={`legend-${index}`} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <div className="legend-text">
                  <span className="legend-name">{entry.name}</span>
                  <span className="legend-value">{entry.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add this function to render a table of top agents
  const renderTopAgentsTable = () => {
    // Use users data to create a sorted list of top agents
    const sortedAgents = [...users]
      .filter(user => user.stats) // This assumes you add a stats property to users, adjust as needed
      .sort((a, b) => (b.stats?.closedTickets || 0) - (a.stats?.closedTickets || 0))
      .slice(0, 5);
    
    // If we don't have stats, use placeholder data
    const agentsToShow = sortedAgents.length > 0 ? sortedAgents : [
      { name: 'Jane Doe', stats: { closedTickets: 402, satisfaction: 92 } },
      { name: 'John Smith', stats: { closedTickets: 389, satisfaction: 89 } },
      { name: 'Emily Johnson', stats: { closedTickets: 350, satisfaction: 87 } },
      { name: 'Michael Brown', stats: { closedTickets: 275, satisfaction: 85 } },
      { name: 'Sarah Davis', stats: { closedTickets: 241, satisfaction: 90 } }
    ];
    
    return (
      <div className="top-agents-container">
        <h3>Top Agents</h3>
        <table className="top-agents-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Tickets Closed</th>
              <th>Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {agentsToShow.map((agent, index) => (
              <tr key={index}>
                <td>{agent.name}</td>
                <td>{agent.stats?.closedTickets || 0}</td>
                <td>{agent.stats?.satisfaction || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`admin-analytics-page ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <SideNavbar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className="admin-analytics-content">
        {/* Page header with view selection toggle */}
        <div className="page-header">
          <div className="header-left">
            <h2>Analytics Dashboard</h2>
            <p className="subtitle">Monitor performance metrics and insights</p>
          </div>
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'agent' ? 'active' : ''}
              onClick={() => setViewMode('agent')}
            >
              Agent Performance
            </button>
            <button 
              className={viewMode === 'business' ? 'active' : ''}
              onClick={() => setViewMode('business')}
            >
              Business Overview
            </button>
            <button 
              className={viewMode === 'ai' ? 'active' : ''}
              onClick={() => {
                setViewMode('ai');
                setShowAiAgentAnalytics(true);
              }}
            >
              AI Agent Analytics
            </button>
          </div>
        </div>

        {/* Conditional rendering based on viewMode */}
        {viewMode === 'ai' ? (
          // AI Agent Analytics View
          renderAiAgentAnalytics()
        ) : viewMode === 'business' ? (
          // Business Overview View
          <section className="analytics-container">
            {businessStats.error ? (
              <div className="error-container">
                <p>{businessStats.error}</p>
                <button className="retry-button" onClick={() => {
                  hasAggregatedRef.current = false;
                  setBusinessStats(prev => ({...prev}));
                }}>
                  Retry
                </button>
              </div>
            ) : !businessStats.counts || !businessStats.timing ? (
              <div className="loading-container">
                <p>Loading company-wide analytics...</p>
              </div>
            ) : (
              <>
                <div className="business-analytics">
                  <p className="business-analytics-description">
                    Overall performance metrics for your business
                  </p>
                  
                  <div className="business-stats-grid">
                    <div className="stats-card">
                      <div className="stats-value">{businessStats.counts.totalQuestions || 0}</div>
                      <div className="stats-label">Total Questions</div>
                    </div>
                    <div className="stats-card">
                      <div className="stats-value">{businessStats.counts.answeredQuestions || 0}</div>
                      <div className="stats-label">Answered</div>
                    </div>
                    <div className="stats-card">
                      <div className="stats-value">{businessStats.counts.unansweredQuestions || 0}</div>
                      <div className="stats-label">Unanswered</div>
                    </div>
                    <div className="stats-card">
                      <div className="stats-value">
                        {businessStats.counts.totalQuestions > 0 
                          ? Math.round((businessStats.counts.answeredQuestions / businessStats.counts.totalQuestions) * 100) + '%' 
                          : '0%'}
                      </div>
                      <div className="stats-label">Response Rate</div>
                    </div>
                  </div>
                </div>
                
                {/* Topic Performance Section - Only in Business View */}
                <section className="analytics-section">
                  <div className="section-header-with-toggle">
                    <h3>Topic Performance</h3>
                  </div>
                  
                  <div className="project-selector">
                    <label htmlFor="project-select">Select Topic:</label>
                    {projects.length === 0 ? (
                      <div className="empty-projects-message">
                        <p>No topics available for this business</p>
                      </div>
                    ) : (
                      <select 
                        id="project-select"
                        value={selectedProject || ''}
                        onChange={(e) => setSelectedProject(e.target.value || null)}
                      >
                        <option value="">Select a topic</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {projectLoading ? (
                    <div className="loading-container">
                      <p>Loading topic data...</p>
                    </div>
                  ) : projectStats ? (
                    <div className="project-stats">
                      <div className="stats-cards">
                        <div className="stats-card">
                          <div className="stats-value">{projectStats.totalQuestions}</div>
                          <div className="stats-label">Total Questions</div>
                        </div>
                        <div className="stats-card">
                          <div className="stats-value">{projectStats.answeredQuestions}</div>
                          <div className="stats-label">Answered</div>
                        </div>
                        <div className="stats-card">
                          <div className="stats-value">{projectStats.unansweredQuestions}</div>
                          <div className="stats-label">Unanswered</div>
                        </div>
                        <div className="stats-card">
                          <div className="stats-value">
                            {projectStats.totalQuestions > 0 
                              ? Math.round((projectStats.answeredQuestions / projectStats.totalQuestions) * 100) + '%' 
                              : '0%'}
                          </div>
                          <div className="stats-label">Completion Rate</div>
                        </div>
                      </div>
                      
                      {/* Add visual representation */}
                      <div className="topic-progress">
                        <h4>Completion Progress</h4>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{
                              width: `${projectStats.totalQuestions > 0 ? 
                                (projectStats.answeredQuestions / projectStats.totalQuestions) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <div className="progress-labels">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="no-data-message">Select a topic to view its analytics</p>
                  )}
                  
                  {/* Topic comparison section */}
                  <div className="topics-comparison">
                    <h4>Topics Performance Comparison</h4>
                    
                    {error ? (
                      <div className="error-container">
                        <p>{error}</p>
                        <button className="retry-button" onClick={() => window.location.reload()}>
                          Retry
                        </button>
                      </div>
                    ) : allProjectStats.length === 0 ? (
                      <p className="no-data-message">No topic data available for this business</p>
                    ) : (
                      <>
                        <div className="chart-legend">
                          <div className="legend-item">
                            <div className="legend-color answered"></div>
                            <span>Answered</span>
                          </div>
                          <div className="legend-item">
                            <div className="legend-color unanswered"></div>
                            <span>Unanswered</span>
                          </div>
                        </div>
                        
                        <div className="topics-chart">
                          {allProjectStats.map(project => (
                            <div 
                              key={project.id} 
                              className={`topic-bar-container ${selectedProject === project.id.toString() ? 'active' : ''}`}
                              onClick={() => handleTopicBarClick(project.id)}
                            >
                              <div className="topic-name">{project.name}</div>
                              <div className="topic-bar">
                                <div 
                                  className="topic-bar-answered" 
                                  style={{ width: `${project.total > 0 ? (project.answered / project.total) * 100 : 0}%` }}
                                ></div>
                                <div 
                                  className="topic-bar-unanswered" 
                                  style={{ 
                                    width: `${project.total > 0 ? (project.unanswered / project.total) * 100 : 0}%`,
                                    left: `${project.total > 0 ? (project.answered / project.total) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                              <div className="topic-counts">
                                <span className="answered-count">{project.answered}</span>
                                <span className="total-count">{project.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </section>
                
                {/* Time-based Performance Section - Only in Business View */}
                <section className="analytics-section">
                  <h3>Response Time Analysis</h3>
                  
                  {performanceLoading ? (
                    <div className="loading-container">
                      <p>Loading trend data...</p>
                    </div>
                  ) : (
                    renderAgentPerformance()
                  )}
                </section>
              </>
            )}
          </section>
        ) : (
          // Agent Performance View (default)
          <section className="analytics-container">
            {error ? (
              <div className="error-container">
                <p>{error}</p>
                <button className="retry-button" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <section className="user-selector-section">
                  <h3>Select Agent</h3>
                  <div className="agent-selector">
                    <label htmlFor="agent-select">Select Agent:</label>
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="user-select"
                    >
                      <option value="">Select an agent</option>
                      {users.map(user => (
                        <option key={user.userId || `user-${Math.random()}`} value={user.userId}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
                
                {/* Agent-specific analytics content */}
                {selectedUserId ? (
                  <>
                    <section className="agent-analytics-content">
                      <h3>
                        {users.find(u => u.userId && selectedUserId && 
                          u.userId.toString() === selectedUserId.toString())?.name || 
                           users.find(u => u.userId && selectedUserId && 
                            u.userId.toString() === selectedUserId.toString())?.email || 
                            'Agent'} Performance
                      </h3>
                      
                      {agentAnalytics.loading ? (
                        <div className="loading-container">
                          <p>Loading agent analytics...</p>
                        </div>
                      ) : agentAnalytics.error ? (
                        <div className="error-container">
                          <p>{agentAnalytics.error}</p>
                          <button className="retry-button" onClick={() => {
                            loadAgentData(selectedUserId);
                          }}>
                            Retry
                          </button>
                        </div>
                      ) : !agentAnalytics.counts || !agentAnalytics.timing ? (
                        <p className="no-data-message">No data available for this agent</p>
                      ) : (
                        <div className="agent-stats">
                          {agentAnalytics.timing && (
                            <section className="analytics-section">
                              <h3>Agent Response Time Analytics</h3>
                              
                              <div className="stats-cards timing-cards">
                                <div className="stats-card">
                                  <div className="stats-value">{formatTime(agentAnalytics.timing.averageResponseTimeMinutes)}</div>
                                  <div className="stats-label">Average Response Time</div>
                                </div>
                                <div className="stats-card">
                                  <div className="stats-value">{formatTime(agentAnalytics.timing.fastestResponseTimeMinutes)}</div>
                                  <div className="stats-label">Fastest Response</div>
                                </div>
                                <div className="stats-card">
                                  <div className="stats-value">{formatTime(agentAnalytics.timing.slowestResponseTimeMinutes)}</div>
                                  <div className="stats-label">Slowest Response</div>
                                </div>
                              </div>
                              
                              <div className="time-period-info">
                                <div className="time-period-item">
                                  <span className="metadata-label">First Answer:</span>
                                  <span className="metadata-value">{formatDate(agentAnalytics.timing.oldestAnswerDate)}</span>
                                </div>
                                <div className="time-period-item">
                                  <span className="metadata-label">Latest Answer:</span>
                                  <span className="metadata-value">{formatDate(agentAnalytics.timing.newestAnswerDate)}</span>
                                </div>
                              </div>
                              
                              {agentAnalytics.timing.details && agentAnalytics.timing.details.length > 0 && (
                                <div className="response-table-container">
                                  <h4>Agent Response Details</h4>
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
                                      {agentAnalytics.timing.details.map((detail, index) => (
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
                              )}
                            </section>
                          )}
                        </div>
                      )}
                    </section>
                    
                    {/* Agent Comparison Section - Only in Agent View */}
                    <section className="analytics-section">
                      <div className="section-header-with-toggle">
                        <h3>Agent Comparison</h3>
                        <button 
                          className="comparison-toggle" 
                          onClick={() => setShowComparison(!showComparison)}
                        >
                          {showComparison ? 'Hide Comparison' : 'Show Comparison'}
                        </button>
                      </div>
                      
                      {showComparison && comparisonData && (
                        <div className="comparison-container">
                          <div className="comparison-summary">
                            <div className="comparison-metric">
                              <span className="metric-label">Agent Rank:</span>
                              <span className="metric-value">
                                {comparisonData.selectedAgentRank} of {comparisonData.totalAgents}
                              </span>
                            </div>
                            
                            <div className="comparison-metric">
                              <span className="metric-label">Response Time vs Company Avg:</span>
                              <span className={`metric-value ${agentAnalytics.timing && 
                                agentAnalytics.timing.averageResponseTimeMinutes < comparisonData.companyAvg ? 
                                'positive' : 'negative'}`}>
                                {agentAnalytics.timing ? 
                                  formatTime(agentAnalytics.timing.averageResponseTimeMinutes - comparisonData.companyAvg) : 
                                  'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="agent-ranking">
                            <h4>Agent Response Time Ranking</h4>
                            <div className="ranking-list">
                              {comparisonData.agents.map((agent, index) => (
                                <div 
                                  key={agent.userId} 
                                  className={`ranking-item ${agent.userId === parseInt(selectedUserId) ? 'current-agent' : ''}`}
                                >
                                  <span className="rank">{index + 1}</span>
                                  <span className="agent-name">{agent.name}</span>
                                  <span className="response-time">{formatTime(agent.avgResponseTime)}</span>
                                  <span className="answer-count">{agent.totalAnswers} answers</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <p className="prompt-message">Please select an agent to view their performance metrics</p>
                )}
              </>
            )}
          </section>
        )}

        {/* Conversation Detail View */}
        {selectedConversation && (
          <section className="analytics-section conversation-detail">
            <div className="section-header">
              <button 
                className="back-button"
                onClick={() => setSelectedConversation(null)}
              >
                ← Back to Conversations
              </button>
              <h2>Conversation Detail</h2>
            </div>
            
            {!selectedConversation.messages || selectedConversation.messages.length === 0 ? (
              <p className="no-data-message">Conversation details not available</p>
            ) : (
              <div className="conversation-detail-content">
                <div className="conversation-metadata">
                  <div className="metadata-item">
                    <span className="label">Conversation ID:</span>
                    <span className="value">{selectedConversation.conversationId || 'N/A'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Started:</span>
                    <span className="value">
                      {selectedConversation.startTime ? new Date(selectedConversation.startTime).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Status:</span>
                    <span className="value">{selectedConversation.endTime ? 'Completed' : 'Active'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Topic:</span>
                    <span className="value">{selectedConversation.primaryTopic || 'Unknown'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Total Messages:</span>
                    <span className="value">{selectedConversation.messages?.length || 0}</span>
                  </div>
                </div>
                
                <div className="conversation-messages">
                  <h3>Conversation History</h3>
                  <div className="messages-container">
                    {selectedConversation.messages && selectedConversation.messages.map((message, index) => {
                      // Determine if we should show this message
                      const isUser = message.messageType === "USER";
                      const isPersonalizedAi = message.messageType === "PERSONALIZED_AI";
                      const isRegularAi = message.messageType === "AI";
                      
                      // Only show AI messages if they have a category or are personalized
                      const shouldDisplay = isUser || isPersonalizedAi || 
                        (isRegularAi && message.messageCategory);
                      
                      if (!shouldDisplay) return null;
                      
                      return (
                        <div 
                          key={message.messageId || `message-${index}`} 
                          className={`message ${isUser ? 'user-message' : 'ai-message'}`}
                        >
                          <div className="message-header">
                            <span className="message-sender">
                              {isUser ? 'User' : (isPersonalizedAi ? 'Support AI' : 'AI')}
                            </span>
                            <span className="message-time">
                              {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Unknown time'}
                            </span>
                          </div>
                          <div className="message-content">{message.message}</div>
                          {message.messageCategory && (
                            <div className="message-category">
                              {message.messageCategory.replace(/_/g, ' ').toLowerCase()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminAnalyticsPage; 