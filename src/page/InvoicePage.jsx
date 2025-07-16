import React, { useEffect, useState } from 'react';
import { apiClient, createSubscriptionInvoice, setAuthToken } from '../services/ApiService';
import { useUserContext } from '../context/LoginContext';
import './InvoicePage.css';

const InvoicePage = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        setError('Failed to fetch subscription information');
        setLoading(false);
        console.error('Error fetching subscription info:', err);
      });
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const handleCreateInvoice = async (subscription) => {
    try {
      // Check if user is authenticated
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Set the auth token before making the API call
      setAuthToken(token);
      console.log('🔑 Auth token set for invoice creation');

      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const billingStart = subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const billingEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Use the full Stripe subscription ID instead of extracting numeric part
      const stripeSubscriptionId = subscription.id;
      if (!stripeSubscriptionId) {
        throw new Error('Invalid subscription ID');
      }

      // Log the original subscription data for debugging
      console.log('🔍 Original subscription data:', subscription);
      console.log('🔍 Subscription metadata:', subscription.metadata);
      console.log('🔍 Subscription plan:', subscription.plan);

      const invoiceData = {
        subscriptionId: stripeSubscriptionId, // Use full Stripe subscription ID
        businessId: 2, // Default business ID
        amount: parseFloat(subscription.plan?.amount || 0), // Ensure it's a number
        status: 'PENDING',
        billingPeriodStart: billingStart.toISOString(),
        billingPeriodEnd: billingEnd.toISOString(),
        invoiceDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        // Add metadata that the backend might need
        planId: subscription.plan?.id || null,
        customerId: subscription.customerId || null
      };

      // Validate the data before sending
      if (!invoiceData.subscriptionId) {
        throw new Error('Subscription ID is required');
      }
      if (!invoiceData.businessId) {
        throw new Error('Business ID is required');
      }
      if (invoiceData.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      console.log('📄 Creating invoice with data:', JSON.stringify(invoiceData, null, 2));
      
      // Try to create the invoice
      const response = await createSubscriptionInvoice(invoiceData);
      console.log('✅ Invoice created successfully:', response);
      
      // Show success message
      setError(null);
      alert(`Invoice created successfully!\n\nSubscription ID: ${invoiceData.subscriptionId}\nAmount: $${(invoiceData.amount / 100).toFixed(2)}\nStatus: ${invoiceData.status}\n\nInvoice ID: ${response.id || 'N/A'}`);
      
      // Refresh the data
      fetchSubscriptionData();
    } catch (err) {
      console.error('❌ Error creating invoice:', err);
      console.error('❌ Error response data:', err.response?.data);
      
      // If the error is about missing metadata, try a different approach
      if (err.response?.data?.message?.includes('metadata missing')) {
        console.log('🔄 Trying alternative approach without subscription sync...');
        try {
          // Try with minimal data that doesn't require subscription sync
          const minimalInvoiceData = {
            subscriptionId: subscription.id, // Use subscription.id directly
            businessId: 2,
            amount: parseFloat(subscription.plan?.amount || 0),
            status: 'PENDING',
            invoiceDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          console.log('📄 Trying minimal invoice data:', JSON.stringify(minimalInvoiceData, null, 2));
          const response = await createSubscriptionInvoice(minimalInvoiceData);
          console.log('✅ Invoice created with minimal data:', response);
          
          setError(null);
          alert(`Invoice created successfully (minimal data)!\n\nSubscription ID: ${minimalInvoiceData.subscriptionId}\nAmount: $${(minimalInvoiceData.amount / 100).toFixed(2)}\nStatus: ${minimalInvoiceData.status}`);
          
          fetchSubscriptionData();
          return;
        } catch (minimalErr) {
          console.error('❌ Minimal approach also failed:', minimalErr);
        }
      }
      
      setError(err.response?.data?.message || err.message || 'Failed to create invoice');
    }
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
    <div className="invoice-page-container">
      <div className="page-header">
        <h2>Subscription Information</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : subscriptionData ? (
        <div className="subscription-info">
          <div className="customer-info">
            <h3>Customer Details</h3>
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
            <div className="detail-row">
              <span>Has Stripe Customer:</span>
              <span>{subscriptionData.hasStripeCustomer ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="subscriptions-section">
            <h3>Subscriptions ({subscriptionData.subscriptions?.length || 0})</h3>
            {subscriptionData.subscriptions && subscriptionData.subscriptions.length > 0 ? (
              subscriptionData.subscriptions.map(subscription => (
                <div key={subscription.id} className="subscription-card">
                  <div className="subscription-header">
                    <h4>Subscription ID: {subscription.id}</h4>
                    <button 
                      className="btn-create-invoice" 
                      onClick={() => handleCreateInvoice(subscription)}
                    >
                      Create Invoice
                    </button>
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
                      <span><strong>Collection Method:</strong></span>
                      <span>{subscription.collectionMethod || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span><strong>Cancel at Period End:</strong></span>
                      <span>{subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span><strong>Created:</strong></span>
                      <span>{formatDate(subscription.created)}</span>
                    </div>
                    <div className="detail-row">
                      <span><strong>Start Date:</strong></span>
                      <span>{formatDate(subscription.startDate)}</span>
                    </div>
                    {subscription.endedAt && (
                      <div className="detail-row">
                        <span><strong>Ended At:</strong></span>
                        <span>{formatDate(subscription.endedAt)}</span>
                      </div>
                    )}
                    {subscription.canceledAt && (
                      <div className="detail-row">
                        <span><strong>Canceled At:</strong></span>
                        <span>{formatDate(subscription.canceledAt)}</span>
                      </div>
                    )}
                  </div>

                  {subscription.plan && (
                    <div className="plan-details">
                      <h5>Plan Details</h5>
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
                      <div className="detail-row">
                        <span><strong>Product:</strong></span>
                        <span>{subscription.plan.product}</span>
                      </div>
                    </div>
                  )}

                  {subscription.items && subscription.items.length > 0 && (
                    <div className="subscription-items">
                      <h5>Subscription Items</h5>
                      {subscription.items.map(item => (
                        <div key={item.id} className="item-details">
                          <div className="detail-row">
                            <span><strong>Item ID:</strong></span>
                            <span>{item.id}</span>
                          </div>
                          <div className="detail-row">
                            <span><strong>Quantity:</strong></span>
                            <span>{item.quantity}</span>
                          </div>
                          {item.price && (
                            <div className="detail-row">
                              <span><strong>Unit Amount:</strong></span>
                              <span>{formatAmount(item.price.unitAmount, item.price.currency)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {subscription.latestInvoiceId && (
                    <div className="latest-invoice">
                      <h5>Latest Invoice</h5>
                      <div className="detail-row">
                        <span><strong>Invoice ID:</strong></span>
                        <span>{subscription.latestInvoiceId}</span>
                      </div>
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
        <div>No subscription data available</div>
      )}
    </div>
  );
};

export default InvoicePage; 