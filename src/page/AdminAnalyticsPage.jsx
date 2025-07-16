import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/LoginContext';
import { agentQuestions as agentQuestionsApi, users as usersApi, projects as projectsApi, conversations as conversationsApi } from '../services/ApiService';
import './AdminAnalyticsPage.css';
import DonutProgressChart from '../Components/DonutProgressChart';
import { useSidebarContext } from '../context/SidebarContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';

const AdminAnalyticsPage = () => {
  const { userId, role, stateBusinessId } = useUserContext();
  const navigate = useNavigate();
  const { setActiveSidebarType } = useSidebarContext();
  
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessApiAvailable, setBusinessApiAvailable] = useState(false);
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
          const selectedAgentRank = agentPerformance.findIndex(a => a.userId === selectedUserId);
          
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

  useEffect(() => {
    setActiveSidebarType('userActions');
  }, [setActiveSidebarType]);

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
      // The agentId is expected to be a UUID string by the API.
      // The previous logic to extract a numericId was causing issues.
      console.log('Fetching analytics for specific agent ID:', agentId);
      
      // Use the agentId directly for API calls
      const countsPromise = agentQuestionsApi.getCountsForUser(agentId);
      const timingPromise = agentQuestionsApi.getTimingForUser(agentId);
      
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

  // Add state for conversation detail messages
  const [conversationDetailLoading, setConversationDetailLoading] = useState(false);
  const [conversationDetailError, setConversationDetailError] = useState(null);
  const [conversationDetail, setConversationDetail] = useState(null);

  // Add state for message view mode
  const [messageViewMode, setMessageViewMode] = useState('alternating'); // 'alternating' or 'all'

  // Function to load ALL conversation messages (not just alternating)
  const loadAllConversationMessages = useCallback(async (conversation) => {
    setConversationDetailLoading(true);
    setConversationDetailError(null);
    
    try {
      const conversationId = conversation.conversationId || conversation.conversation_id;
      
      if (!conversationId) {
        throw new Error('Conversation ID is missing');
      }
      
      console.log('🔍 Loading ALL messages for conversation ID:', conversationId);
      
      // Use the regular conversation endpoint that includes all messages
      const response = await conversationsApi.getConversation(conversationId);
      
      console.log('📥 All messages API response:', response);
      
      // The regular conversation endpoint returns the conversation with all messages
      const allMessages = response.messages || response.data?.messages || [];
      
      setConversationDetail({
        ...conversation,
        alternatingMessages: allMessages, // Using same state but with all messages
        totalMessages: allMessages.length,
        hasMore: false,
        pattern: 'All message types included'
      });
      
      console.log('✅ Successfully loaded ALL conversation messages:', {
        conversationId: conversationId,
        messageCount: allMessages.length
      });
    } catch (error) {
      console.error('❌ Error loading all conversation messages:', error);
      setConversationDetailError(`Failed to load all conversation messages: ${error.message}`);
    } finally {
      setConversationDetailLoading(false);
    }
  }, []);

  // Function to load detailed conversation messages using the new endpoint
  const loadConversationDetail = useCallback(async (conversation) => {
    setConversationDetailLoading(true);
    setConversationDetailError(null);
    setConversationDetail(null);
    
    try {
      // Use the conversation_id field from backend (mapped to conversationId in frontend)
      const conversationId = conversation.conversationId || conversation.conversation_id;
      
      if (!conversationId) {
        throw new Error('Conversation ID is missing');
      }
      
      console.log('🔍 Loading conversation detail for ID:', conversationId);
      console.log('🔍 Message view mode:', messageViewMode);
      
      // Choose endpoint based on view mode
      if (messageViewMode === 'all') {
        await loadAllConversationMessages(conversation);
        return;
      }
      
      // Use the alternating messages endpoint for filtered view
      console.log('📞 Calling API: getAlternatingMessages(' + conversationId + ')');
      const response = await conversationsApi.getAlternatingMessages(conversationId);
      
      console.log('📥 Alternating messages API response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', Object.keys(response || {}));
      
      // The response structure should be: { conversationId, messages, totalCount, hasMore, pattern }
      const messagesData = response.messages || response.data?.messages || [];
      const totalCount = response.totalCount || response.data?.totalCount || 0;
      const hasMore = response.hasMore || response.data?.hasMore || false;
      const pattern = response.pattern || response.data?.pattern || 'USER -> PERSONALIZED_AI alternating';
      
      console.log('📋 Processed data:', {
        messagesCount: messagesData.length,
        totalCount,
        hasMore,
        pattern
      });
      
      setConversationDetail({
        ...conversation,
        alternatingMessages: messagesData,
        totalMessages: totalCount,
        hasMore: hasMore,
        pattern: pattern
      });
      
      console.log('✅ Successfully loaded conversation detail:', {
        conversationId: conversationId,
        messageCount: messagesData.length,
        totalMessages: totalCount,
        hasMore: hasMore
      });
    } catch (error) {
      console.error('❌ Error loading conversation detail:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setConversationDetailError(`Failed to load conversation messages: ${error.message}`);
    } finally {
      setConversationDetailLoading(false);
    }
  }, [messageViewMode, loadAllConversationMessages]);

  // Add function to load conversation data
  const loadConversations = useCallback(async () => {
    if (!stateBusinessId) return;
    
    setConversationsLoading(true);
    setConversationError(null);
    
    try {
      console.log('Loading conversations for business ID:', stateBusinessId);
      
      // Fix: Remove .data since axios already unwraps the response
      const response = await conversationsApi.getByBusinessId(stateBusinessId);
      
      console.log('Raw conversations response:', response);
      
      // Handle the response - it might be an array directly or wrapped in data
      let conversationsData = Array.isArray(response) ? response : (response.data || []);
      
      // Map backend field names to frontend expectations
      const normalizedConversations = conversationsData.map(conv => ({
        ...conv,
        // Map conversation_id to conversationId if needed
        conversationId: conv.conversationId || conv.conversation_id,
        // Map business_id to businessId if needed  
        businessId: conv.businessId || conv.business_id,
        // Ensure other fields are present
        startTime: conv.startTime || conv.start_time,
        endTime: conv.endTime || conv.end_time,
        primaryTopic: conv.primaryTopic || conv.primary_topic,
        messageCount: conv.messageCount || conv.message_count || 0
      }));
      
      setConversations(normalizedConversations);
      console.log('Processed conversations:', normalizedConversations);
      
      // Load analytics data
      try {
        const analyticsResponse = await conversationsApi.getAnalytics(stateBusinessId, conversationPeriod);
        console.log('Analytics response:', analyticsResponse);
        setConversationAnalytics(analyticsResponse || null);
      } catch (analyticsError) {
        console.error('Analytics endpoint unavailable:', analyticsError);
        // Don't set error - we'll show a limited view with just conversations
      }
    } catch (err) {
      console.error('Error fetching conversation data:', err);
      setConversationError('Failed to load AI conversation data. Please try again later.');
    } finally {
      setConversationsLoading(false);
    }
  }, [stateBusinessId, conversationPeriod]);
  
  // View a single conversation - NOW DEFINED AFTER loadConversationDetail
  const viewConversation = useCallback(async (conversation) => {
    console.log('Viewing conversation:', conversation.conversationId || conversation.conversation_id);
    console.log('Full conversation object:', conversation);
    
    setSelectedConversation(conversation);
    await loadConversationDetail(conversation);
  }, [loadConversationDetail]);
  
  // Load conversations when the AI analytics view is shown
  useEffect(() => {
    if (showAiAgentAnalytics && stateBusinessId) {
      loadConversations();
    }
  }, [showAiAgentAnalytics, stateBusinessId, loadConversations]);

  // Add state for modal
  const [showConversationModal, setShowConversationModal] = useState(false);

  // Add new state for conversation filtering
  const [conversationFilters, setConversationFilters] = useState({
    status: 'all',
    topic: 'all',
    dateRange: 'all',
    messageType: 'all',
    sortBy: 'newest'
  });

  // Add filtering function
  const getFilteredConversations = useCallback(() => {
    if (!conversations.length) return [];
    
    let filtered = [...conversations];
    
    // Filter by status
    if (conversationFilters.status !== 'all') {
      filtered = filtered.filter(conv => {
        const isCompleted = conv.endTime;
        return conversationFilters.status === 'completed' ? isCompleted : !isCompleted;
      });
    }
    
    // Filter by topic
    if (conversationFilters.topic !== 'all') {
      filtered = filtered.filter(conv => 
        conv.primaryTopic === conversationFilters.topic
      );
    }
    
    // Filter by date range
    if (conversationFilters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (conversationFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(conv => 
        conv.startTime && new Date(conv.startTime) >= filterDate
      );
    }
    
    // Sort conversations
    filtered.sort((a, b) => {
      const dateA = new Date(a.startTime || 0);
      const dateB = new Date(b.startTime || 0);
      
      switch (conversationFilters.sortBy) {
        case 'oldest':
          return dateA - dateB;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });
    
    return filtered;
  }, [conversations, conversationFilters]);

  // Get unique topics for filter dropdown
  const availableTopics = useMemo(() => {
    const topics = conversations
      .map(conv => conv.primaryTopic)
      .filter(topic => topic && topic !== 'General');
    return [...new Set(topics)];
  }, [conversations]);

  // Update the renderAiAgentAnalytics function to include filters
  const renderAiAgentAnalytics = () => {
    if (!showAiAgentAnalytics) return null;

    const filteredConversations = getFilteredConversations();

    return (
      <section className="analytics-section ai-agent-analytics">
        <div className="section-header">
          <h2>AI Agent Analytics</h2>
          <div className="period-selector">
            <label htmlFor="conversation-period">Time Period:</label>
            <select 
              id="conversation-period"
              value={conversationPeriod} 
              onChange={(e) => setConversationPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>

        {conversationsLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading AI conversation data...</p>
          </div>
        ) : conversationError ? (
          <div className="error-container">
            <p className="error-message">{conversationError}</p>
            <button 
              className="retry-button modern-button danger" 
              onClick={loadConversations}
            >
              <span className="button-icon">🔄</span>
              <span className="button-text">Retry</span>
            </button>
          </div>
        ) : (
          <>
            {/* Analytics Summary Cards */}
            {conversationAnalytics && (
              <div className="analytics-summary">
                <div className="analytics-card">
                  <h3>Total Conversations</h3>
                  <p className="analytics-number">{conversationAnalytics.totalConversations || 0}</p>
                </div>
                <div className="analytics-card">
                  <h3>Active Users</h3>
                  <p className="analytics-number">{conversationAnalytics.activeUsers || 0}</p>
                </div>
                <div className="analytics-card">
                  <h3>Avg Response Time</h3>
                  <p className="analytics-number">{conversationAnalytics.avgResponseTime || 'N/A'}</p>
                </div>
                <div className="analytics-card">
                  <h3>Satisfaction Rate</h3>
                  <p className="analytics-number">{conversationAnalytics.satisfactionRate || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Conversation Filters */}
            <div className="conversation-filters">
              <h4>Filter Conversations</h4>
              <div className="filter-controls">
                <div className="filter-group">
                  <label htmlFor="status-filter">Status:</label>
                  <select
                    id="status-filter"
                    value={conversationFilters.status}
                    onChange={(e) => setConversationFilters(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="completed">Completed Only</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="topic-filter">Topic:</label>
                  <select
                    id="topic-filter"
                    value={conversationFilters.topic}
                    onChange={(e) => setConversationFilters(prev => ({
                      ...prev,
                      topic: e.target.value
                    }))}
                  >
                    <option value="all">All Topics</option>
                    <option value="General">General</option>
                    {availableTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="date-filter">Date Range:</label>
                  <select
                    id="date-filter"
                    value={conversationFilters.dateRange}
                    onChange={(e) => setConversationFilters(prev => ({
                      ...prev,
                      dateRange: e.target.value
                    }))}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="sort-filter">Sort By:</label>
                  <select
                    id="sort-filter"
                    value={conversationFilters.sortBy}
                    onChange={(e) => setConversationFilters(prev => ({
                      ...prev,
                      sortBy: e.target.value
                    }))}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                <button
                  className="clear-filters-button modern-button secondary"
                  onClick={() => setConversationFilters({
                    status: 'all',
                    topic: 'all',
                    dateRange: 'all',
                    messageType: 'all',
                    sortBy: 'newest'
                  })}
                >
                  <span className="button-icon">🗑️</span>
                  <span className="button-text">Clear Filters</span>
                </button>
              </div>
            </div>

            {/* Conversations Table */}
            <div className="conversations-section">
              <div className="conversations-header">
                <h3>
                  Conversations ({filteredConversations.length}
                  {filteredConversations.length !== conversations.length && (
                    <span className="filter-note"> of {conversations.length} total</span>
                  )}
                  )
                </h3>
                {filteredConversations.length !== conversations.length && (
                  <div className="active-filters">
                    <span className="filter-indicator">Filters applied</span>
                  </div>
                )}
              </div>
              
              {filteredConversations.length > 0 ? (
                <div className="conversations-table-container">
                  <table className="conversations-table">
                    <thead>
                      <tr>
                        <th>Conversation ID</th>
                        <th>Started</th>
                        <th>Status</th>
                        <th>Topic</th>
                        <th>Messages</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConversations.map((conversation, index) => {
                        // Handle different ID formats
                        const displayId = conversation.conversationId || conversation.conversation_id || `conv-${index}`;
                        const shortId = displayId.toString().substring(0, 8);
                        
                        return (
                          <tr key={displayId}>
                            <td className="conversation-id">
                              {shortId}...
                            </td>
                            <td>
                              {conversation.startTime 
                                ? new Date(conversation.startTime).toLocaleDateString()
                                : 'Unknown'
                              }
                            </td>
                            <td>
                              <span className={`status-badge ${conversation.endTime ? 'completed' : 'active'}`}>
                                {conversation.endTime ? 'Completed' : 'Active'}
                              </span>
                            </td>
                            <td>{conversation.primaryTopic || 'General'}</td>
                            <td>{conversation.messageCount || 'N/A'}</td>
                            <td>
                              <button 
                                className="view-details-button modern-button success"
                                onClick={(e) => {
                                  e.preventDefault();
                                  console.log('View button clicked for conversation:', conversation);
                                  setSelectedConversation(conversation);
                                  setShowConversationModal(true);
                                  loadConversationDetail(conversation);
                                }}
                                type="button"
                              >
                                <span className="button-icon">👁️</span>
                                <span className="button-text">View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data-container">
                  <p className="no-data-message">
                    {conversations.length === 0 
                      ? "No conversations found for the selected period."
                      : "No conversations match the current filters."
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    );
  };

  // Add ConversationModal component
  const ConversationModal = () => {
    if (!showConversationModal || !selectedConversation) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowConversationModal(false)}>
        <div className="modal-content conversation-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Conversation Details</h2>
            <div className="modal-controls">
              {/* View mode selector */}
              <div className="view-mode-selector">
                <label htmlFor="modal-message-view-mode">View:</label>
                <select 
                  id="modal-message-view-mode"
                  value={messageViewMode}
                  onChange={(e) => {
                    setMessageViewMode(e.target.value);
                    loadConversationDetail(selectedConversation);
                  }}
                >
                  <option value="alternating">Alternating USER ↔ AI</option>
                  <option value="all">All Messages</option>
                </select>
              </div>
              <button 
                className="close-modal-button modern-button secondary"
                onClick={() => {
                  setShowConversationModal(false);
                  setSelectedConversation(null);
                  setConversationDetail(null);
                  setConversationDetailError(null);
                  setMessageViewMode('alternating');
                }}
              >
                <span className="button-icon">✕</span>
                <span className="button-text">Close</span>
              </button>
            </div>
          </div>
          
          {conversationDetailLoading ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <p>Loading conversation messages...</p>
            </div>
          ) : conversationDetailError ? (
            <div className="modal-error">
              <p className="error-message">{conversationDetailError}</p>
              <button 
                className="retry-button modern-button" 
                onClick={() => loadConversationDetail(selectedConversation)}
              >
                <span className="button-icon">🔄</span>
                <span className="button-text">Retry</span>
              </button>
            </div>
          ) : conversationDetail ? (
            <div className="modal-body">
              {/* Conversation metadata */}
              <div className="conversation-metadata-compact">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">ID:</span>
                    <span className="value">{selectedConversation.conversationId || selectedConversation.conversation_id}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Started:</span>
                    <span className="value">
                      {selectedConversation.startTime ? new Date(selectedConversation.startTime).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Status:</span>
                    <span className="value">
                      <span className={`status-badge ${selectedConversation.endTime ? 'completed' : 'active'}`}>
                        {selectedConversation.endTime ? 'Completed' : 'Active'}
                      </span>
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Topic:</span>
                    <span className="value">{selectedConversation.primaryTopic || 'General'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Messages:</span>
                    <span className="value">
                      {conversationDetail.alternatingMessages?.length || 0}
                      {conversationDetail.totalMessages && conversationDetail.totalMessages > (conversationDetail.alternatingMessages?.length || 0) && (
                        <span className="message-count-note"> of {conversationDetail.totalMessages} total</span>
                      )}
                    </span>
                  </div>
                  {conversationDetail.pattern && (
                    <div className="metadata-item">
                      <span className="label">Pattern:</span>
                      <span className="value">{conversationDetail.pattern}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages container */}
              <div className="modal-messages-container">
                <h3>
                  {messageViewMode === 'all' 
                    ? 'All Conversation Messages' 
                    : 'Conversation History (Alternating User ↔ AI Messages)'}
                </h3>
                
                {/* Message type breakdown */}
                {conversationDetail.alternatingMessages && conversationDetail.alternatingMessages.length > 0 && (
                  <div className="message-breakdown">
                    <div className="breakdown-stats">
                      <span className="stat-item">
                        <span className="stat-icon">👤</span>
                        USER: {conversationDetail.alternatingMessages.filter(m => m.messageType === 'USER').length}
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">✨</span>
                        PERSONALIZED_AI: {conversationDetail.alternatingMessages.filter(m => m.messageType === 'PERSONALIZED_AI').length}
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">🎭</span>
                        PERSONALITY_AI: {conversationDetail.alternatingMessages.filter(m => m.messageType === 'PERSONALITY_AI').length}
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">📊</span>
                        AI_STATUS: {conversationDetail.alternatingMessages.filter(m => m.messageType === 'AI_STATUS').length}
                      </span>
                    </div>
                    
                    {messageViewMode === 'alternating' && conversationDetail.alternatingMessages.filter(m => m.messageType !== 'USER').length === 0 && (
                      <div className="warning-message">
                        ⚠️ This conversation contains only user messages - no AI responses were generated.
                        <br />
                        💡 Try switching to "All Messages" view to see system/status messages.
                      </div>
                    )}
                  </div>
                )}
                
                <div className="messages-list">
                  {conversationDetail.alternatingMessages && conversationDetail.alternatingMessages.length > 0 ? (
                    conversationDetail.alternatingMessages.map((message, index) => {
                      const isUser = message.messageType === "USER";
                      const isPersonalizedAi = message.messageType === "PERSONALIZED_AI";
                      const isPersonalityAi = message.messageType === "PERSONALITY_AI";
                      const isAiStatus = message.messageType === "AI_STATUS";
                      
                      return (
                        <div 
                          key={message.messageId || `message-${index}`} 
                          className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}
                        >
                          <div className="message-header">
                            <div className="message-sender-info">
                              <span className="message-sender-icon">
                                {isUser ? '👤' : 
                                 isPersonalizedAi ? '✨' : 
                                 isPersonalityAi ? '🎭' :
                                 isAiStatus ? '📊' : '🤖'}
                              </span>
                              <span className="message-sender-name">
                                {isUser ? 'User' : 
                                 isPersonalizedAi ? 'Personalized AI' : 
                                 isPersonalityAi ? 'Personality AI' :
                                 isAiStatus ? 'AI Status' :
                                 message.messageType}
                              </span>
                            </div>
                            <div className="message-meta">
                              <span className="message-time">
                                {message.timestamp ? new Date(message.timestamp).toLocaleString() : 
                                 message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Unknown time'}
                              </span>
                              <span 
                                className="message-type-badge" 
                                style={{
                                  backgroundColor: isUser ? '#1976d2' : 
                                                 isPersonalizedAi ? '#4caf50' :
                                                 isPersonalityAi ? '#ff9800' : 
                                                 isAiStatus ? '#9c27b0' : '#9e9e9e'
                                }}
                              >
                                {message.messageType}
                              </span>
                            </div>
                          </div>
                          <div className="message-content">{message.message || 'No message content'}</div>
                          {message.messageCategory && (
                            <div className="message-category">
                              Category: {message.messageCategory.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-messages-placeholder">
                      <span className="placeholder-icon">💬</span>
                      <p>No {messageViewMode === 'all' ? '' : 'alternating '}messages to display</p>
                    </div>
                  )}
                </div>
                
                {conversationDetail.hasMore && (
                  <div className="load-more-container">
                    <button 
                      className="load-more-button modern-button secondary"
                      onClick={() => {
                        console.log('🔄 Load more messages requested');
                        // TODO: Implement pagination
                      }}
                    >
                      <span className="button-icon">⬇️</span>
                      <span className="button-text">Load More Messages</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-data-placeholder">
              <span className="placeholder-icon">📭</span>
              <p>No conversation details available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render business-wide performance stats
  const renderBusinessWidePerformance = () => {
    if (!businessApiAvailable || !businessStats.counts || !businessStats.timing) {
      return (
        <div className="api-status-message">
          <p className="api-status-error">Business analytics data is currently unavailable or still loading.</p>
          {businessStats.error && <p>Error: {businessStats.error}</p>}
        </div>
      );
    }

    const { counts, timing } = businessStats;
    const responseRate = counts.totalQuestions > 0 ? (counts.answeredQuestions / counts.totalQuestions) * 100 : 0;

    return (
      <div className="business-stats-overview">
        <h3>Business-Wide Performance</h3>
        <div className="stats-cards">
          <div className="stats-card">
            <div className="stats-label">Total Questions</div>
            <div className="stats-value">{counts.totalQuestions || 0}</div>
          </div>
          <div className="stats-card">
            <div className="stats-label">Answered Questions</div>
            <div className="stats-value">{counts.answeredQuestions || 0}</div>
          </div>
          <div className="stats-card">
            <div className="stats-label">Unanswered Questions</div>
            <div className="stats-value">{counts.unansweredQuestions || 0}</div>
          </div>
          <div className="stats-card">
            <div className="stats-label">Response Rate</div>
            <DonutProgressChart percentage={responseRate} size={70} strokeWidth={7} />
          </div>
          <div className="stats-card">
            <div className="stats-label">Avg. Response Time</div>
            <div className="stats-value">{formatTime(timing.averageResponseTimeMinutes)}</div>
          </div>
          <div className="stats-card">
            <div className="stats-label">Active Agents</div>
            <div className="stats-value">{users.length}</div>
          </div>
        </div>
      </div>
    );
  };

  // Add state for detailed comparison
  const [detailedComparison, setDetailedComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Add the complete loadDetailedComparison function
  const loadDetailedComparison = useCallback(async () => {
    if (!users.length) return;
    
    setComparisonLoading(true);
    try {
      console.log('Loading detailed comparison for', users.length, 'users');
      
      // Get real analytics data for all users
      const allAgentsData = await Promise.all(
        users.map(async (user) => {
          try {
            console.log('Loading analytics for user:', user.firstName, user.lastName);
            
            // Get analytics for each user using the corrected API
            const userAnalytics = await agentQuestionsApi.getAgentAnalytics(user.userId, stateBusinessId);
            
            const counts = userAnalytics.data.counts || {};
            const timing = userAnalytics.data.timing || {};
            
            return {
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              responseTime: timing.averageResponseTimeMinutes || 0,
              accuracy: counts.totalQuestions > 0 ? 
                ((counts.totalQuestions - (counts.unansweredQuestions || 0)) / counts.totalQuestions * 100) : 0,
              volume: (counts.totalQuestions || 0) - (counts.unansweredQuestions || 0),
              totalQuestions: counts.totalQuestions || 0,
              unansweredQuestions: counts.unansweredQuestions || 0,
              projectCount: counts.projectCount || 0,
              satisfaction: Math.random() * 20 + 80, // This would come from actual satisfaction surveys
              efficiency: timing.averageResponseTimeMinutes && timing.averageResponseTimeMinutes > 0 ? 
                Math.max(0, 100 - (timing.averageResponseTimeMinutes / 60) * 10) : 0,
              lastActive: user.lastLoginTime || user.createdAt,
              joinDate: user.createdAt,
              fastestResponse: timing.fastestResponseTimeMinutes || 0,
              slowestResponse: timing.slowestResponseTimeMinutes || 0
            };
          } catch (error) {
            console.error(`Error loading analytics for user ${user.userId}:`, error);
            return {
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              responseTime: 0,
              accuracy: 0,
              volume: 0,
              totalQuestions: 0,
              unansweredQuestions: 0,
              projectCount: 0,
              satisfaction: 0,
              efficiency: 0,
              lastActive: user.lastLoginTime || user.createdAt,
              joinDate: user.createdAt,
              fastestResponse: 0,
              slowestResponse: 0
            };
          }
        })
      );

      console.log('All agents data loaded:', allAgentsData);

      // Show all agents, even those with no activity (but mark them differently)
      const activeAgents = allAgentsData.filter(agent => 
        agent.volume > 0 || agent.totalQuestions > 0
      );
      
      console.log('Active agents:', activeAgents.length, 'of', allAgentsData.length);

      // Calculate company averages based on active agents
      let companyAverages = {
        responseTime: 0,
        accuracy: 0,
        volume: 0,
        satisfaction: 0,
        efficiency: 0,
      };
      
      if (activeAgents.length > 0) {
        companyAverages = {
          responseTime: activeAgents.reduce((sum, a) => sum + a.responseTime, 0) / activeAgents.length,
          accuracy: activeAgents.reduce((sum, a) => sum + a.accuracy, 0) / activeAgents.length,
          volume: activeAgents.reduce((sum, a) => sum + a.volume, 0) / activeAgents.length,
          satisfaction: activeAgents.reduce((sum, a) => sum + a.satisfaction, 0) / activeAgents.length,
          efficiency: activeAgents.reduce((sum, a) => sum + a.efficiency, 0) / activeAgents.length,
        };
      }

      // Sort agents by overall performance score
      const sortedByPerformance = [...activeAgents].sort((a, b) => {
        const scoreA = (a.accuracy + a.efficiency + (100 - Math.min(a.responseTime, 100))) / 3;
        const scoreB = (b.accuracy + b.efficiency + (100 - Math.min(b.responseTime, 100))) / 3;
        return scoreB - scoreA;
      });

      // Find selected agent or default to first active agent
      const selectedAgent = selectedUserId ? 
        allAgentsData.find(a => a.userId === selectedUserId) :
        (activeAgents.length > 0 ? activeAgents[0] : allAgentsData[0]);

      // Calculate rankings for selected agent
      let rankings = {};
      if (selectedAgent && activeAgents.length > 0) {
        const sortedByResponseTime = [...activeAgents].sort((a, b) => a.responseTime - b.responseTime);
        const sortedByAccuracy = [...activeAgents].sort((a, b) => b.accuracy - a.accuracy);
        const sortedByVolume = [...activeAgents].sort((a, b) => b.volume - a.volume);

        rankings = {
          responseTime: sortedByResponseTime.findIndex(a => a.userId === selectedAgent.userId) + 1,
          accuracy: sortedByAccuracy.findIndex(a => a.userId === selectedAgent.userId) + 1,
          volume: sortedByVolume.findIndex(a => a.userId === selectedAgent.userId) + 1,
          overall: sortedByPerformance.findIndex(a => a.userId === selectedAgent.userId) + 1,
        };
      }

      setDetailedComparison({
        allAgents: allAgentsData,
        activeAgents,
        selectedAgent,
        rankings,
        companyAverages,
        totalAgents: allAgentsData.length,
        totalActiveAgents: activeAgents.length,
        hasData: activeAgents.length > 0
      });

    } catch (error) {
      console.error('Error loading detailed comparison:', error);
      setDetailedComparison({
        allAgents: [],
        activeAgents: [],
        selectedAgent: null,
        rankings: {},
        companyAverages: {},
        totalAgents: 0,
        totalActiveAgents: 0,
        hasData: false,
        error: 'Failed to load comparison data'
      });
    } finally {
      setComparisonLoading(false);
    }
  }, [users, stateBusinessId, selectedUserId, agentQuestionsApi]);

  // Load detailed comparison when users change or component mounts
  useEffect(() => {
    if (users.length > 0 && stateBusinessId && viewMode === 'agent') {
      loadDetailedComparison();
    }
  }, [users, stateBusinessId, viewMode, loadDetailedComparison]);

  // Complete renderEnhancedAgentComparison function
  const renderEnhancedAgentComparison = () => {
    if (comparisonLoading) {
      return (
        <div className="enhanced-agent-comparison">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading team performance data...</p>
          </div>
        </div>
      );
    }

    if (!detailedComparison) {
      return (
        <div className="enhanced-agent-comparison">
          <div className="no-data-placeholder">
            <span className="placeholder-icon">📊</span>
            <h3>No Comparison Data</h3>
            <p>Unable to load team comparison data.</p>
            <button 
              className="modern-button"
              onClick={loadDetailedComparison}
            >
              <span className="button-icon">🔄</span>
              <span className="button-text">Retry</span>
            </button>
          </div>
        </div>
      );
    }

    const { 
      allAgents, 
      activeAgents, 
      selectedAgent, 
      rankings, 
      companyAverages, 
      totalAgents, 
      totalActiveAgents, 
      hasData,
      error 
    } = detailedComparison;

    return (
      <div className="enhanced-agent-comparison">
        <div className="comparison-header">
          <h3>
            <span className="comparison-icon">📊</span>
            Team Performance Analytics
          </h3>
          <div className="team-stats">
            <span className="stat-item">Total Agents: {totalAgents}</span>
            <span className="stat-item">Active Agents: {totalActiveAgents}</span>
            {error && <span className="stat-item error">⚠️ {error}</span>}
          </div>
        </div>

        {!hasData ? (
          <div className="no-active-data-message">
            <div className="message-content">
              <span className="message-icon">🚀</span>
              <h4>Ready to Start Analytics</h4>
              <p>
                You have {totalAgents} agent{totalAgents !== 1 ? 's' : ''} registered, but no question activity yet. 
                Once agents start answering questions, detailed performance analytics will appear here.
              </p>
              <div className="agent-list">
                <h5>Registered Agents:</h5>
                <ul>
                  {allAgents.slice(0, 5).map(agent => (
                    <li key={agent.userId}>
                      {agent.name} ({agent.email})
                    </li>
                  ))}
                  {allAgents.length > 5 && (
                    <li>...and {allAgents.length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Selected Agent Overview */}
            {selectedAgent && (
              <div className="selected-agent-overview">
                <div className="agent-card">
                  <div className="agent-info-header">
                    <div className="agent-details">
                      <h4>{selectedAgent.name}</h4>
                      <p className="agent-email">{selectedAgent.email}</p>
                      <p className="agent-meta">
                        Joined: {formatDate(selectedAgent.joinDate)} • 
                        Last Active: {formatDate(selectedAgent.lastActive)}
                      </p>
                    </div>
                    <div className="agent-status">
                      <span className={`status-indicator ${selectedAgent.volume > 0 ? 'active' : 'inactive'}`}>
                        {selectedAgent.volume > 0 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Dashboard */}
                  <div className="metrics-dashboard">
                    <div className="metric-card">
                      <div className="metric-header">
                        <h4>
                          <span className="metric-icon">⚡</span>
                          Response Time
                        </h4>
                        <span className="performance-indicator">
                          {selectedAgent.responseTime < companyAverages.responseTime ? '🟢' : '🟡'}
                        </span>
                      </div>
                      <div className="metric-values">
                        <div className="current-value">
                          {formatTime(selectedAgent.responseTime)}
                        </div>
                        <div className="comparison-value">
                          Company avg: {formatTime(companyAverages.responseTime)}
                        </div>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-progress"
                          style={{ 
                            width: `${Math.min(100, (selectedAgent.responseTime / Math.max(companyAverages.responseTime * 2, 1)) * 100)}%`,
                            background: selectedAgent.responseTime < companyAverages.responseTime ? 
                              'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <h4>
                          <span className="metric-icon">🎯</span>
                          Accuracy Rate
                        </h4>
                        <span className="performance-indicator">
                          {selectedAgent.accuracy > companyAverages.accuracy ? '🟢' : '🟡'}
                        </span>
                      </div>
                      <div className="metric-values">
                        <div className="current-value">
                          {selectedAgent.accuracy.toFixed(1)}%
                        </div>
                        <div className="comparison-value">
                          Company avg: {companyAverages.accuracy.toFixed(1)}%
                        </div>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-progress"
                          style={{ 
                            width: `${selectedAgent.accuracy}%`,
                            background: selectedAgent.accuracy > companyAverages.accuracy ? 
                              'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <h4>
                          <span className="metric-icon">📈</span>
                          Question Volume
                        </h4>
                        <span className="performance-indicator">
                          {selectedAgent.volume > companyAverages.volume ? '🟢' : '🟡'}
                        </span>
                      </div>
                      <div className="metric-values">
                        <div className="current-value">
                          {selectedAgent.volume}
                        </div>
                        <div className="comparison-value">
                          Company avg: {Math.round(companyAverages.volume)}
                        </div>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-progress"
                          style={{ 
                            width: `${Math.min(100, (selectedAgent.volume / Math.max(companyAverages.volume * 2, 1)) * 100)}%`,
                            background: selectedAgent.volume > companyAverages.volume ? 
                              'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <h4>
                          <span className="metric-icon">⭐</span>
                          Efficiency Score
                        </h4>
                        <span className="performance-indicator">
                          {selectedAgent.efficiency > companyAverages.efficiency ? '🟢' : '🟡'}
                        </span>
                      </div>
                      <div className="metric-values">
                        <div className="current-value">
                          {selectedAgent.efficiency.toFixed(1)}%
                        </div>
                        <div className="comparison-value">
                          Company avg: {companyAverages.efficiency.toFixed(1)}%
                        </div>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-progress"
                          style={{ 
                            width: `${selectedAgent.efficiency}%`,
                            background: selectedAgent.efficiency > companyAverages.efficiency ? 
                              'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Rankings Table */}
            <div className="detailed-rankings">
              <h4>
                <span className="section-icon">🏆</span>
                Team Performance Rankings
              </h4>
              <div className="rankings-container">
                <div className="rankings-table-wrapper">
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Agent</th>
                        <th>Response Time</th>
                        <th>Accuracy</th>
                        <th>Volume</th>
                        <th>Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAgents.map((agent, index) => (
                        <tr 
                          key={agent.userId} 
                          className={`ranking-row ${agent.userId === selectedUserId ? 'current-agent' : ''}`}
                        >
                          <td className="rank-cell">
                            <div className={`rank-badge ${index < 3 ? 'top-rank' : ''}`}>
                              {index + 1}
                            </div>
                          </td>
                          <td>
                            <div className="agent-info">
                              <div>
                                <div className="agent-name">{agent.name}</div>
                                <div className="agent-email-small">{agent.email}</div>
                              </div>
                              {agent.userId === selectedUserId && (
                                <span className="current-badge">Current</span>
                              )}
                            </div>
                          </td>
                          <td className="metric-cell">
                            <div className="metric-value">
                              {formatTime(agent.responseTime)}
                            </div>
                          </td>
                          <td className="metric-cell">
                            <div className="metric-value">
                              {agent.accuracy.toFixed(1)}%
                            </div>
                          </td>
                          <td className="metric-cell">
                            <div className="metric-value">
                              {agent.volume}
                            </div>
                          </td>
                          <td className="score-cell">
                            <div className="score-value">
                              {agent.efficiency.toFixed(1)}%
                            </div>
                            <div className="score-bar">
                              <div 
                                className="score-progress"
                                style={{ width: `${agent.efficiency}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <main className={`admin-analytics-content ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
        <header className="page-header">
          <h1>Analytics Dashboard</h1>
          <p className="page-description">Monitor performance metrics and insights</p>
          
          {/* Enhanced View Toggle Buttons */}
          <div className="view-toggles">
            <button
              className={`view-toggle-button ${viewMode === 'agent' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('agent');
                setShowAiAgentAnalytics(false);
              }}
            >
              <span className="toggle-icon">👤</span>
              <span className="toggle-text">Agent Performance</span>
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'business' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('business');
                setShowAiAgentAnalytics(false);
              }}
            >
              <span className="toggle-icon">🏢</span>
              <span className="toggle-text">Business Overview</span>
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'ai' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('ai');
                setShowAiAgentAnalytics(true);
              }}
            >
              <span className="toggle-icon">🤖</span>
              <span className="toggle-text">AI Agent Analytics</span>
            </button>
          </div>
        </header>

        {/* Conditional rendering based on viewMode */}
        {viewMode === 'ai' ? (
          renderAiAgentAnalytics()
        ) : viewMode === 'business' ? (
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
                  
                  {renderBusinessWidePerformance()}
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
                          <div className="stats-label">Total Questions</div>
                          <div className="stats-value">{projectStats.totalQuestions}</div>
                        </div>
                        <div className="stats-card">
                          <div className="stats-label">Answered</div>
                          <div className="stats-value">{projectStats.answeredQuestions}</div>
                        </div>
                        <div className="stats-card">
                          <div className="stats-label">Unanswered</div>
                          <div className="stats-value">{projectStats.unansweredQuestions}</div>
                        </div>
                        <div className="stats-card">
                          <div className="stats-label">Completion Rate</div>
                          <DonutProgressChart 
                            percentage={projectStats.totalQuestions > 0 
                              ? (projectStats.answeredQuestions / projectStats.totalQuestions) * 100 
                              : 0} 
                            size={70} 
                            strokeWidth={7} 
                          />
                        </div>
                      </div>
                      
                      {/* Visual representation of completion progress is now handled by DonutProgressChart */}
                      {/* Remove old progress bar section
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
                      */}
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
          // Replace the entire agent view section with this combined version:
          viewMode === 'agent' && (
            <section className="analytics-container">
              <div className="agent-performance-section">
                <div className="section-header">
                  <h2>Agent Performance Analytics</h2>
                  <p className="section-description">Compare individual and team performance metrics</p>
                </div>

                {/* Agent Selector */}
                <div className="agent-selector-container">
                  <div className="selector-header">
                    <h3>Select Agent for Detailed Analysis</h3>
                    <div className="team-stats">
                      <span className="stat-item">Total Agents: {users.length}</span>
                      <span className="stat-item">Active: {detailedComparison?.activeAgents?.length || 0}</span>
                    </div>
                  </div>
                  
                  <div className="agent-selector">
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value || null)}
                    >
                      <option value="">Select an agent...</option>
                      {users.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Content */}
                {isLoading || comparisonLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading performance analytics...</p>
                  </div>
                ) : error ? (
                  <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button 
                      className="retry-button modern-button danger" 
                      onClick={() => window.location.reload()}
                    >
                      <span className="button-icon">🔄</span>
                      <span className="button-text">Retry</span>
                    </button>
                  </div>
                ) : (
                  // Render the enhanced agent comparison which includes everything
                  renderEnhancedAgentComparison()
                )}
              </div>
            </section>
          )
        )}
      </main>
      
      <ConversationModal />
    </>
  );
};

export default AdminAnalyticsPage; 