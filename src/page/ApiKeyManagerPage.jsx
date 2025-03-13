import React, { useState, useEffect } from "react";
import "./ApiKeyManagerPage.css";
import { useUserContext } from "../context/LoginContext";

/**
 * A React component for creating, fetching, and deactivating API keys
 * using the authenticated user's business ID from JWT token.
 */
function ApiKeyManagerPage() {
  const { stateBusinessId, role } = useUserContext();
  const [generatedKey, setGeneratedKey] = useState("");
  const [apiKeys, setApiKeys] = useState([]);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Redirect if not an admin
  useEffect(() => {
    if (role !== "ROLE_ADMIN") {
      // You could use the navigate hook from react-router-dom here to redirect
      // Or simply show an access denied message
      setError("Access denied. Admin privileges required.");
    }
  }, [role]);

  // Auto-fetch keys when component loads if business ID is available
  useEffect(() => {
    if (stateBusinessId) {
      fetchApiKeys();
    } else {
      setError("No business ID available. Please ensure you're properly logged in.");
    }
  }, [stateBusinessId]);

  /**
   * Sends a POST request to generate an API key for the current business
   */
  const handleGenerateApiKey = async () => {
    if (!stateBusinessId) {
      setError("No business ID available. Please ensure you're properly logged in.");
      return;
    }
  
    setError(null);
    setIsGenerating(true);
  
    try {
      const response = await fetch("http://localhost:8082/api/admin/api-keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          businessId: Number(stateBusinessId)
        }),
        credentials: "include"
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error generating API key: ${response.status} ${response.statusText}`
        );
      }
  
      const apiKeyResponse = await response.json();
      setGeneratedKey(apiKeyResponse.apiKey);
      await fetchApiKeys();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while generating the API key.");
      setGeneratedKey("");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Fetch active API keys for the business
   */
  const fetchApiKeys = async () => {
    if (!stateBusinessId) {
      setError("No business ID available. Please ensure you're properly logged in.");
      return;
    }

    setError(null);
    setIsFetching(true);

    try {
      const url = `http://localhost:8082/api/admin/api-keys/business/${encodeURIComponent(stateBusinessId)}`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error fetching API keys: ${response.status} ${response.statusText}`
        );
      }

      const keys = await response.json();
      setApiKeys(keys);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while fetching API keys.");
      setApiKeys([]);
    } finally {
      setIsFetching(false);
    }
  };

  /**
   * Deactivate an API key
   */
  const deactivateApiKey = async (keyValue) => {
    setError(null);
    setIsDeactivating(true);

    try {
      const url = `http://localhost:8082/api/admin/api-keys/deactivate/${encodeURIComponent(keyValue)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error deactivating API key: ${response.status} ${response.statusText}`
        );
      }

      // If successful, re-fetch keys
      await fetchApiKeys();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while deactivating the API key.");
    } finally {
      setIsDeactivating(false);
    }
  };

  if (role !== "ROLE_ADMIN") {
    return (
      <div className="api-key-manager-page">
        <h1>Access Denied</h1>
        <div className="error-message" role="alert">
          You need admin privileges to access this page.
        </div>
      </div>
    );
  }

  if (!stateBusinessId) {
    return (
      <div className="api-key-manager-page">
        <h1>API Key Manager</h1>
        <div className="error-message" role="alert">
          No business ID available. Please ensure you're properly logged in.
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-manager-page">
      <h1>API Key Manager</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-section">
        <div className="business-id-display">
          <strong>Business ID:</strong> {stateBusinessId}
        </div>
        
        <div className="button-container">
          <button
            className="button generate-button"
            onClick={handleGenerateApiKey}
            disabled={isGenerating || isFetching || isDeactivating}
          >
            {isGenerating ? "Generating..." : "Generate API Key"}
          </button>
          <button
            className="button fetch-button"
            onClick={fetchApiKeys}
            disabled={isGenerating || isFetching || isDeactivating}
          >
            {isFetching ? "Fetching..." : "Refresh Keys"}
          </button>
        </div>
      </div>

      {generatedKey && (
        <div className="generated-key-section">
          <h2>Newly Generated Key</h2>
          <p className="generated-key">{generatedKey}</p>
        </div>
      )}

      <div className="api-keys-section">
        <h2>Active API Keys</h2>
        {apiKeys.length === 0 ? (
          <p>No active API keys found for this business.</p>
        ) : (
          <table className="api-keys-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Key Value</th>
                <th>Description</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.keyValue}>
                  <td>{apiKey.id}</td>
                  <td>{apiKey.keyValue}</td>
                  <td>{apiKey.description || "N/A"}</td>
                  <td>{apiKey.active ? "Yes" : "No"}</td>
                  <td>
                    {apiKey.active && (
                      <button
                        onClick={() => deactivateApiKey(apiKey.keyValue)}
                        disabled={isDeactivating}
                      >
                        {isDeactivating ? "Deactivating..." : "Deactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ApiKeyManagerPage; 