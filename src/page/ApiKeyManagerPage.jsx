import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import "./ApiKeyManagerPage.css";
import { useUserContext } from "../context/LoginContext";
import { apiKeys as apiKeysService, users as usersApi } from '../services/ApiService';
import { useSidebarContext } from '../context/SidebarContext.jsx';

/**
 * A React component for creating, fetching, and deactivating API keys
 * using the authenticated user's business ID from JWT token.
 */
function ApiKeyManagerPage() {
  const { stateBusinessId, role, token, userId } = useUserContext();
  const [generatedKey, setGeneratedKey] = useState("");
  const { setActiveSidebarType } = useSidebarContext();
  const [apiKeys, setApiKeys] = useState([]);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [operationMessage, setOperationMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);

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

  useEffect(() => {
    setActiveSidebarType('widget');
  }, [setActiveSidebarType]);

  useEffect(() => {
    const fetchUserAndKeys = async () => {
      if (stateBusinessId) {
        await fetchApiKeys();
      } else {
        setError("No business ID available. Please ensure you're properly logged in.");
      }
    };
    fetchUserAndKeys();
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
      const response = await apiKeysService.generate(stateBusinessId);
      setGeneratedKey(response.data.apiKey);
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
      const response = await apiKeysService.getByBusiness(stateBusinessId);
      setApiKeys(response.data);
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
      await apiKeysService.deactivate(keyValue);
      await fetchApiKeys();
      setOperationMessage("API key deactivated successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while deactivating the API key.");
    } finally {
      setIsDeactivating(false);
    }
  };

  if (role !== "ROLE_ADMIN") {
    return (
      <main className="api-key-manager-page-content">
        <Helmet>
          <title>Access Denied | API Key Manager | SupportHub</title>
          <meta name="description" content="Admin privileges required to access the API Key Manager" />
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <h1>Access Denied</h1>
        <div className="error-message" role="alert">
          You need admin privileges to access this page.
        </div>
      </main>
    );
  }

  if (!stateBusinessId) {
    return (
      <main className="api-key-manager-page-content">
        <Helmet>
          <title>Business ID Required | API Key Manager | SupportHub</title>
          <meta name="description" content="Please log in with a valid business account to manage API keys" />
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <h1>API Key Manager</h1>
        <div className="error-message" role="alert">
          No business ID available. Please ensure you're properly logged in.
        </div>
      </main>
    );
  }

  return (
    <main className="api-key-manager-page-content">
      <Helmet>
        <title>API Key Manager | SupportHub</title>
        <meta name="description" content="Generate and manage API keys for your business integration with SupportHub services." />
        <meta name="robots" content="noindex" /> {/* Optional: for private dashboards */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "API Key Manager",
              "description": "Generate and manage API keys for business integration",
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Admin Dashboard",
                    "item": "https://yourdomain.com/admin-dashboard"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "API Key Manager",
                    "item": "https://yourdomain.com/api-key-manager"
                  }
                ]
              }
            }
          `}
        </script>
      </Helmet>

      <header className="page-header">
        <h1>API Key Manager</h1>
        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
          <ol className="breadcrumb">
            <li><a href="/admin-dashboard">Admin Dashboard</a></li>
            <li aria-current="page">API Key Manager</li>
          </ol>
        </nav>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="form-section">
        <div className="business-id-display">
          <strong>Business ID:</strong> {stateBusinessId}
        </div>
        
        <div className="button-container">
          <button
            className="button generate-button"
            onClick={handleGenerateApiKey}
            disabled={isGenerating || isFetching || isDeactivating}
            aria-busy={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate API Key"}
          </button>
          <button
            className="button fetch-button"
            onClick={fetchApiKeys}
            disabled={isGenerating || isFetching || isDeactivating}
            aria-busy={isFetching}
          >
            {isFetching ? "Fetching..." : "Refresh Keys"}
          </button>
        </div>
      </section>

      {generatedKey && (
        <section className="generated-key-section">
          <h2>Newly Generated Key</h2>
          <p className="generated-key" aria-live="polite">{generatedKey}</p>
        </section>
      )}

      <section className="api-keys-section">
        <h2>Active API Keys</h2>
        {apiKeys.length === 0 ? (
          <p role="status">No active API keys found for this business.</p>
        ) : (
          <table className="api-keys-table" aria-label="API Keys">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Key Value</th>
                <th scope="col">Description</th>
                <th scope="col">Active</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => (
                <tr key={apiKey && apiKey.keyValue ? apiKey.keyValue : `key-${apiKey ? apiKey.id : Math.random()}`}>
                  <td>{apiKey ? apiKey.id : 'N/A'}</td>
                  <td>{apiKey && apiKey.keyValue ? apiKey.keyValue : 'N/A'}</td>
                  <td>{apiKey && apiKey.description ? apiKey.description : "N/A"}</td>
                  <td>{apiKey && apiKey.active ? "Yes" : "No"}</td>
                  <td>
                    {apiKey && apiKey.active && (
                      <button
                        onClick={() => {
                          setShowConfirmModal(true);
                          setKeyToDelete(apiKey.keyValue);
                        }}
                        disabled={isDeactivating}
                        className="button deactivate-button"
                        aria-label={`Deactivate API key ${apiKey.keyValue && typeof apiKey.keyValue === 'string' ? apiKey.keyValue.substring(0, 8) : 'N/A'}...`}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showConfirmModal && keyToDelete && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Deactivation</h3>
            <p>Are you sure you want to deactivate the API key: <strong>{typeof keyToDelete === 'string' ? keyToDelete.substring(0, 8) : 'N/A'}...</strong>?</p>
            <div className="confirm-modal-actions">
              <button onClick={() => {
                if (keyToDelete) deactivateApiKey(keyToDelete);
                setShowConfirmModal(false);
                setKeyToDelete(null);
              }} className="button danger-button">
                Yes, Deactivate
              </button>
              <button onClick={() => {
                setShowConfirmModal(false);
                setKeyToDelete(null);
              }} className="button secondary-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default ApiKeyManagerPage; 