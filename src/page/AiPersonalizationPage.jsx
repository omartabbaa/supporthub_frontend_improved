import React, { useState, useEffect, useContext } from 'react';
import './AiPersonalizationPage.css';
import { useUserContext } from '../context/LoginContext';
import { aiPersonalitiesApi } from '../services/ApiService';
import { useSidebarContext } from '../context/SidebarContext.jsx';

const AiPersonalizationPage = () => {
  const { stateBusinessId, token } = useUserContext();
  const { setActiveSidebarType } = useSidebarContext();

  const initialPersonalityState = {
    aiName: 'Support Assistant',
    personaDescription: '', // For "Personality" textarea
    basePrompt: '',         // For "Instruction Prompt" textarea
    companyOverview: '',    // NEW: For "Company Overview" textarea
    greetingMessage: 'Hello! How can I assist you today?',
    fallbackResponse: "I'm sorry, I'm not sure how to help with that. Can I assist with anything else?",
  };

  const [personalityConfig, setPersonalityConfig] = useState(initialPersonalityState);
  const [persistedPersonalityId, setPersistedPersonalityId] = useState(null); // To store the ID if fetched

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setActiveSidebarType('widget');
  }, [setActiveSidebarType]);

  useEffect(() => {
    const fetchPersonality = async () => {
      if (!stateBusinessId) {
        console.log("Business ID not available, cannot fetch AI personality.");
        setPersonalityConfig(initialPersonalityState);
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      setError(null);
      try {
        const response = await aiPersonalitiesApi.getByBusinessId(stateBusinessId);
        if (response.data) {
          const fetched = response.data;
          setPersonalityConfig({
            aiName: fetched.aiName || initialPersonalityState.aiName,
            personaDescription: fetched.personaDescription || initialPersonalityState.personaDescription,
            basePrompt: fetched.basePrompt || initialPersonalityState.basePrompt,
            companyOverview: fetched.companyOverview || initialPersonalityState.companyOverview,
            greetingMessage: fetched.greetingMessage || initialPersonalityState.greetingMessage,
            fallbackResponse: fetched.fallbackResponse || initialPersonalityState.fallbackResponse,
          });
          setPersistedPersonalityId(fetched.id); // Assuming DTO returns 'id'
        } else {
          // No personality found, use defaults
          setPersonalityConfig(initialPersonalityState);
          setPersistedPersonalityId(null);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.log("No AI personality found for this business. Using defaults.");
          setPersonalityConfig(initialPersonalityState);
          setPersistedPersonalityId(null);
        } else {
          console.error("Error fetching AI personality:", err);
          setError("Failed to load AI personality settings.");
          setPersonalityConfig(initialPersonalityState); // Revert to defaults on error
          setPersistedPersonalityId(null);
        }
      } finally {
        setIsFetching(false);
      }
    };

    if (token) { // Only fetch if authenticated
      fetchPersonality();
    } else {
      setIsFetching(false); // Not logged in, don't attempt fetch
      setPersonalityConfig(initialPersonalityState);
      setError("Please log in to manage AI personalization.");
    }
  }, [stateBusinessId, token]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPersonalityConfig(prevConfig => ({
      ...prevConfig,
      [name]: value,
    }));
    setSuccessMessage(''); // Clear messages on edit
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stateBusinessId) {
      setError("Cannot save: Business ID is missing.");
      return;
    }
    if (!token) {
      setError("Authentication required to save settings.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    const payload = { ...personalityConfig };

    // Log the payload and relevant info before sending
    console.log("Attempting to save AI Personality. Persisted ID:", persistedPersonalityId);
    console.log("Payload to be sent:", payload);

    try {
      let response;
      // Your backend uses PUT /api/ai-personalities/business/{businessId} for updates
      // and POST /api/ai-personalities for creates.
      // The create DTO needs businessId.
      if (persistedPersonalityId) { 
        // For PUT, the businessId is in the URL, payload is UpdateAiPersonalityRequest
        console.log("Calling updatePersonalityByBusinessId with businessId:", stateBusinessId, "and payload:", payload);
        response = await aiPersonalitiesApi.updatePersonalityByBusinessId(stateBusinessId, payload);
      } else {
        // For POST, the payload is CreateAiPersonalityRequest which includes businessId
        const createPayload = { ...payload, businessId: stateBusinessId };
        console.log("Calling createPersonality with payload:", createPayload);
        response = await aiPersonalitiesApi.createPersonality(createPayload);
      }
      
      console.log("Backend response data:", response.data);

      if (response.data) {
        setSuccessMessage("AI Personality saved successfully!");
        if (response.data.id) { // Update persisted ID if it's a new creation or if ID changes (unlikely for PUT)
            setPersistedPersonalityId(response.data.id);
        }
        // Optionally re-fetch or update state more directly from response.data
        setPersonalityConfig({
            aiName: response.data.aiName || initialPersonalityState.aiName,
            personaDescription: response.data.personaDescription || initialPersonalityState.personaDescription,
            basePrompt: response.data.basePrompt || initialPersonalityState.basePrompt,
            companyOverview: response.data.companyOverview || initialPersonalityState.companyOverview,
            greetingMessage: response.data.greetingMessage || initialPersonalityState.greetingMessage,
            fallbackResponse: response.data.fallbackResponse || initialPersonalityState.fallbackResponse,
        });

      }
    } catch (err) {
      console.error('Error saving AI personality:', err);
      setError(err.response?.data?.message || err.message || "Failed to save AI personality. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="aiPersonalizationPage loading-state">
        <h1>AI Personalization</h1>
        <p>Loading AI personality settings...</p>
      </div>
    );
  }

  return (
    <div className="aiPersonalizationPage">
      <h1>AI Personalization</h1>
      <p className="intro-text">
        Configure your AI's personality, instructions, and default messages.
      </p>
      <form onSubmit={handleSubmit} className="personalizationForm">
        <div className="formGroup">
          <label htmlFor="aiName">AI Name:</label>
          <input
            type="text"
            id="aiName"
            name="aiName"
            value={personalityConfig.aiName}
            onChange={handleInputChange}
            placeholder="e.g., Support Bot, Captain Helper"
            className="formInput"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="personaDescription">Personality Description:</label>
          <textarea
            id="personaDescription"
            name="personaDescription"
            value={personalityConfig.personaDescription}
            onChange={handleInputChange}
            placeholder="Describe the AI's character, tone, and style. E.g., Friendly and empathetic, always uses positive language. Avoids technical jargon."
            className="userInfoTextarea"
            rows="5"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="basePrompt">Base Instructions/brief company overview. Prompt:</label>
          <textarea
            id="basePrompt"
            name="basePrompt"
            value={personalityConfig.basePrompt}
            onChange={handleInputChange}
            placeholder="Provide core instructions for the AI. E.g., You are a helpful assistant for SupportHub. Your goal is to resolve customer queries efficiently. Always ask clarifying questions if the user's intent is unclear. Prioritize information from the provided knowledge base."
            className="userInfoTextarea"
            rows="7"
          />
        </div>
        
        <div className="formGroup">
          <label htmlFor="companyOverview">Company Overview:</label>
          <textarea
            id="companyOverview"
            name="companyOverview"
            value={personalityConfig.companyOverview}
            onChange={handleInputChange}
            placeholder="Provide a brief overview of your company. This helps the AI understand context about your business when it's not directly related to a specific instruction."
            className="userInfoTextarea"
            rows="5"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="greetingMessage">Greeting Message:</label>
          <input
            type="text"
            id="greetingMessage"
            name="greetingMessage"
            value={personalityConfig.greetingMessage}
            onChange={handleInputChange}
            placeholder="e.g., Hello! How can I help you today?"
            className="formInput"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="fallbackResponse">Fallback Response:</label>
          <input
            type="text"
            id="fallbackResponse"
            name="fallbackResponse"
            value={personalityConfig.fallbackResponse}
            onChange={handleInputChange}
            placeholder="e.g., I'm sorry, I couldn't find an answer to that."
            className="formInput"
          />
        </div>
        
        {error && <p className="errorMessage" role="alert">{error}</p>}
        {successMessage && <p className="successMessage" role="status">{successMessage}</p>}

        <button type="submit" className="submitButton" disabled={isLoading || !stateBusinessId}>
          {isLoading ? 'Saving...' : 'Save AI Personality'}
        </button>
        {!stateBusinessId && <p className="errorMessage">Business ID not found. Cannot save.</p>}
      </form>
    </div>
  );
};

export default AiPersonalizationPage; 