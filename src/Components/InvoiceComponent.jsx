import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { apiClient, setAuthToken } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';
import './InvoiceComponent.css';

const InvoiceComponent = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [existingInvoices, setExistingInvoices] = useState([]);
  const processedSubscriptions = useRef(new Set());
  const { user, token } = useUserContext();

  const fetchSubscriptionData = () => {
    if (!user) {
      setError('No user email available');
      setLoading(false);
      return;
    }

    apiClient.get(`/api/stripe/subscriptions/search?email=${encodeURIComponent(user)}`)
      .then(res => {
        if (res.data && res.data.success) {
          setSubscriptionData(res.data);
          setLoading(false);
        } else {
          setError('Invalid response format');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching subscription info:', err);
        setError('Failed to fetch subscription information');
        setLoading(false);
      });
  };

  const fetchExistingInvoices = async () => {
    try {
      const response = await apiClient.get('/api/subscription-invoices/business/2');
      setExistingInvoices(response.data || []);
    } catch (err) {
      console.error('Error fetching existing invoices:', err);
      setExistingInvoices([]);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
    fetchExistingInvoices();
  }, [user]);

  // Check if a subscription already has an invoice - MEMOIZED VERSION
  const hasExistingInvoice = useMemo(() => {
    if (!subscriptionData?.subscriptions || !existingInvoices.length) {
      return new Map();
    }
    
    const invoiceMap = new Map();
    
    subscriptionData.subscriptions.forEach(subscription => {
      if (!subscription?.id) {
        return;
      }
      
      // Check if there's an invoice with the same Stripe Subscription ID
      const hasInvoice = existingInvoices.some(invoice => {
        return invoice.stripeSubscriptionId === subscription.id;
      });
      
      invoiceMap.set(subscription.id, hasInvoice);
    });
    
    return invoiceMap;
  }, [subscriptionData?.subscriptions, existingInvoices]);

  // Helper function to get the memoized result
  const subscriptionHasInvoice = useCallback((subscriptionId) => {
    return hasExistingInvoice.get(subscriptionId) || false;
  }, [hasExistingInvoice]);

  // Auto-create invoices for subscriptions that don't have them
  const autoCreateInvoices = useCallback(async () => {
    if (!subscriptionData?.subscriptions) {
      return;
    }

    for (const subscription of subscriptionData.subscriptions) {
      const hasInvoice = subscriptionHasInvoice(subscription.id);
      
      if (!hasInvoice && subscription.plan?.amount && !processedSubscriptions.current.has(subscription.id)) {
        processedSubscriptions.current.add(subscription.id);
        await createInvoiceForSubscription(subscription);
      }
    }
  }, [subscriptionData, subscriptionHasInvoice]);

  useEffect(() => {
    if (subscriptionData) {
      autoCreateInvoices();
    }
  }, [subscriptionData, autoCreateInvoices]);

  // Manual invoice creation function
  const createInvoiceForSubscription = async (subscription) => {
    if (!subscription.plan?.amount) {
      return;
    }

    try {
      setCreatingInvoice(true);
      
      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const invoiceData = {
        subscriptionId: subscription.id,
        businessId: 2,
        planId: subscription.plan.id,
        amount: parseFloat(subscription.plan.amount) / 100,
        status: 'PENDING',
        invoiceDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        billingPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      };
      
      const { apiClient } = await import('../services/ApiService');
      const response = await apiClient.post('/api/subscription-invoices', invoiceData);
      
      await fetchExistingInvoices();
      
    } catch (err) {
      console.error(`Failed to create invoice for subscription ${subscription.id}:`, err);
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Get existing invoices for a subscription
  const getInvoicesForSubscription = (subscription) => {
    if (!subscription?.plan?.id || !existingInvoices.length) {
      return [];
    }
    
    return existingInvoices.filter(invoice => 
      // This check might need updating if planId is not reliable
      invoice.planId === subscription.plan.id
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount, currency = 'usd') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="invoice-component">
      <div className="component-header">
        <h3>Billing & Invoices</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading subscription information...</div>
      ) : subscriptionData ? (
        <div className="subscription-info">
          <div className="customer-info">
            <h4>Customer Details</h4>
            <div className="detail-row">
              <span>Name:</span>
              <span>{subscriptionData.customerName || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Email:</span>
              <span>{subscriptionData.email || user || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Customer ID:</span>
              <span>{subscriptionData.customerId || 'N/A'}</span>
            </div>
          </div>

          <div className="subscriptions-section">
            <h4>Subscriptions ({subscriptionData.subscriptions?.length || 0})</h4>
            {subscriptionData.subscriptions && subscriptionData.subscriptions.length > 0 ? (
              subscriptionData.subscriptions.map(subscription => (
                <div key={subscription.id} className="subscription-card">
                  <div className="subscription-header">
                    <h5>Subscription ID: {subscription.id}</h5>
                    {subscriptionHasInvoice(subscription.id) ? (
                      <span className="invoice-exists-badge">Invoice Exists</span>
                    ) : creatingInvoice ? (
                      <span className="creating-invoice-badge">Creating Invoice...</span>
                    ) : (
                      <div className="no-invoice-section">
                        <span className="no-invoice-badge">No Invoice Yet</span>
                        {subscription.plan?.amount && (
                          <button 
                            className="create-invoice-button"
                            onClick={() => createInvoiceForSubscription(subscription)}
                            disabled={creatingInvoice}
                          >
                            Create Invoice
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="subscription-details">
                    <div className="detail-row">
                      <span><strong>Status:</strong></span>
                      <span>{subscription.status}</span>
                    </div>
                    <div className="detail-row">
                      <span><strong>Currency:</strong></span>
                      <span>{subscription.currency?.toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span><strong>Cancel at Period End:</strong></span>
                      <span>{subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span><strong>Created:</strong></span>
                      <span>{formatDate(subscription.created)}</span>
                    </div>
                  </div>

                  {subscription.plan && (
                    <div className="plan-details">
                      <h6>Plan Details</h6>
                      <div className="detail-row">
                        <span><strong>Plan ID:</strong></span>
                        <span>{subscription.plan.id}</span>
                      </div>
                      <div className="detail-row">
                        <span><strong>Amount:</strong></span>
                        <span>{formatAmount(subscription.plan.amount, subscription.plan.currency)}</span>
                      </div>
                      <div className="detail-row">
                        <span><strong>Interval:</strong></span>
                        <span>{subscription.plan.interval} ({subscription.plan.intervalCount})</span>
                      </div>
                    </div>
                  )}

                  {/* Display existing invoices for this subscription */}
                  {subscriptionHasInvoice(subscription.id) && (
                    <div className="existing-invoices">
                      <h6>Existing Invoices</h6>
                      {getInvoicesForSubscription(subscription).map(invoice => (
                        <div key={invoice.id} className="invoice-item">
                          <div className="detail-row">
                            <span><strong>Invoice ID:</strong></span>
                            <span>{invoice.id}</span>
                          </div>
                          <div className="detail-row">
                            <span><strong>Amount:</strong></span>
                            <span>${invoice.amount}</span>
                          </div>
                          <div className="detail-row">
                            <span><strong>Status:</strong></span>
                            <span className={`status-${invoice.status?.toLowerCase()}`}>
                              {invoice.status}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span><strong>Invoice Date:</strong></span>
                            <span>{formatDate(invoice.invoiceDate)}</span>
                          </div>
                          <div className="detail-row">
                            <span><strong>Due Date:</strong></span>
                            <span>{formatDate(invoice.dueDate)}</span>
                          </div>
                          {invoice.paymentDate && (
                            <div className="detail-row">
                              <span><strong>Payment Date:</strong></span>
                              <span>{formatDate(invoice.paymentDate)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-subscriptions">
                <p>No subscriptions found for this customer.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-data">No subscription data available</div>
      )}
    </div>
  );
};

export default InvoiceComponent; 