import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeService } from '../services/StripeService';
import './CheckoutReturnPage.css';

const CheckoutReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found. Please try again.');
      return;
    }

    const checkSessionStatus = async () => {
      try {
        const { data } = await stripeService.getSessionStatus(sessionId);
        
        if (data.status === 'complete') {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been updated.');
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else if (data.status === 'open') {
          setStatus('error');
          setMessage('Payment was not completed. Please try again.');
        } else {
          setStatus('error');
          setMessage('An error occurred. Please try again.');
        }
      } catch (error) {
        console.error('Error checking session status:', error);
        setStatus('error');
        setMessage('Failed to verify payment status. Please contact support.');
      }
    };

    checkSessionStatus();
  }, [searchParams, navigate]);

  return (
    <div className="checkout-return-page">
      <div className={`status-card ${status}`}>
        <div className="status-icon">
          {status === 'loading' && '⌛'}
          {status === 'success' && '✓'}
          {status === 'error' && '⚠️'}
        </div>
        <h2>
          {status === 'loading' && 'Processing Payment...'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'error' && 'Payment Failed'}
        </h2>
        <p>{message}</p>
        {status === 'success' && (
          <p className="redirect-message">Redirecting to dashboard...</p>
        )}
        {status === 'error' && (
          <button 
            className="retry-button"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutReturnPage; 