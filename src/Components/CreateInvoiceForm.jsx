import React, { useState, useCallback, useEffect } from 'react';
import { createSubscriptionInvoice } from '../services/ApiService';
import './CreateInvoiceForm.css';

const CreateInvoiceForm = ({ subscription, onSuccess, onCancel }) => {
  // Calculate default dates
  const now = new Date();
  const defaultDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const defaultBillingStart = subscription?.current_period_start 
    ? new Date(subscription.current_period_start * 1000) 
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultBillingEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [formData, setFormData] = useState({
    subscriptionId: subscription?.id || '',
    businessId: subscription?.businessId || '2', // Default to 2 if not provided
    amount: subscription?.plan?.amount ? (subscription.plan.amount).toFixed(2) : '',
    status: 'PENDING',
    billingPeriodStart: defaultBillingStart.toISOString().slice(0, 16),
    billingPeriodEnd: defaultBillingEnd.toISOString().slice(0, 16),
    invoiceDate: now.toISOString().slice(0, 16),
    dueDate: defaultDueDate.toISOString().slice(0, 16)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Extract numeric part from subscription ID (sub_ABC123 -> 123)
      const numericSubscriptionId = formData.subscriptionId.split('_')[1]?.replace(/\D/g, '');
      if (!numericSubscriptionId) {
        throw new Error('Invalid subscription ID format');
      }

      // Format the data according to the backend DTO requirements
      const invoiceData = {
        subscriptionId: parseInt(numericSubscriptionId),
        businessId: parseInt(formData.businessId),
        amount: parseFloat(formData.amount),
        status: formData.status,
        billingPeriodStart: new Date(formData.billingPeriodStart).toISOString(),
        billingPeriodEnd: new Date(formData.billingPeriodEnd).toISOString(),
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString()
      };

      console.log('Submitting invoice data:', invoiceData);
      const response = await createSubscriptionInvoice(invoiceData);
      console.log('Invoice created successfully:', response);
      
      setLoading(false);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create invoice. Please check all fields and try again.');
      setLoading(false);
    }
  };

  const handleClose = useCallback((e) => {
    if (e.type === 'keydown' && e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleClose);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    return () => {
      document.removeEventListener('keydown', handleClose);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button 
          type="button" 
          className="modal-close" 
          onClick={onCancel}
          aria-label="Close"
        />
        <div className="create-invoice-form">
          <h2>Create New Invoice</h2>
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subscriptionId">Subscription ID</label>
              <input
                type="text"
                id="subscriptionId"
                name="subscriptionId"
                value={formData.subscriptionId}
                onChange={handleChange}
                required
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessId">Business ID</label>
              <input
                type="text"
                id="businessId"
                name="businessId"
                value={formData.businessId}
                onChange={handleChange}
                required
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                pattern="^\d*\.?\d{0,2}$"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="billingPeriodStart">Billing Period Start</label>
              <input
                type="datetime-local"
                id="billingPeriodStart"
                name="billingPeriodStart"
                value={formData.billingPeriodStart}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingPeriodEnd">Billing Period End</label>
              <input
                type="datetime-local"
                id="billingPeriodEnd"
                name="billingPeriodEnd"
                value={formData.billingPeriodEnd}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="invoiceDate">Invoice Date</label>
              <input
                type="datetime-local"
                id="invoiceDate"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceForm; 