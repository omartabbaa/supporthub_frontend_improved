import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { agentInvitations as agentInvitationsApi } from '../services/ApiService';
import './AccountActivationPage.css';
import logo from '../assets/Logo/navbarLogo.png';

const AccountActivationPage = () => {
  const { tokenId: paramTokenId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get tokenId from multiple possible sources
  const getTokenFromUrl = () => {
    // Try URL parameters first
    if (paramTokenId) return paramTokenId;
    
    // Try query parameters with various names
    const possibleTokenParams = ['token', 'tokenId', 'activationToken', 'verificationToken', 'id'];
    for (const param of possibleTokenParams) {
      const value = searchParams.get(param);
      if (value) return value;
    }
    
    // Try extracting from URL hash if present
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      for (const param of possibleTokenParams) {
        const value = hashParams.get(param);
        if (value) return value;
      }
    }
    
    return null;
  };
  
  const tokenId = getTokenFromUrl();
  const queryEmail = searchParams.get('email') || searchParams.get('userEmail') || searchParams.get('agentEmail');
  const queryVerificationCode = searchParams.get('code') || searchParams.get('verificationCode') || searchParams.get('activationCode');
  
  const [email, setEmail] = useState(queryEmail || '');
  const [verificationCode, setVerificationCode] = useState(queryVerificationCode || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = verify, 2 = set password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Not enough characters',
    isValid: false
  });

  // Show error if no tokenId is found
  useEffect(() => {
    if (!tokenId) {
      setError('Invalid activation link. Please check your email and try again. If the problem persists, please contact support.');
    }
  }, [tokenId]);

  // Password validation
  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let isValid = false;
    
    if (password.length === 0) {
      message = 'Not enough characters';
    } else if (password.length < 8) {
      score = 1;
      message = 'Password is too short';
    } else {
      score = 2;
      message = 'Minimal strength';
      isValid = true;
      
      // Check for more complexity
      if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
        score++;
        message = 'Medium strength';
      }
      
      if (/[0-9]/.test(password)) {
        score++;
        message = 'Good strength';
      }
      
      if (/[^A-Za-z0-9]/.test(password)) {
        score++;
        message = 'Strong password';
      }
    }
    
    return { score, message, isValid };
  };

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    
    if (!tokenId) {
      setError('Invalid activation link. Missing token.');
      return;
    }
    
    if (!email || !verificationCode) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting verification with:', { tokenId, email, verificationCode });
      
      const response = await agentInvitationsApi.verify({
        tokenId,
        email,
        verificationCode
      });
      
      console.log('Verification response:', response);
      
      if (response.data === true || response === true) {
        setStep(2); // Move to password creation step
      } else {
        setError('Verification failed. Please check your code and try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';
        
        if (status === 400) {
          setError(message || 'Invalid verification details. Please check your code and email.');
        } else if (status === 404) {
          setError('Invitation not found or expired. Please request a new invitation.');
        } else {
          setError(`Error (${status}): ${message}`);
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivationSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // Validate password strength
    if (!passwordStrength.isValid) {
      setError('Password is not strong enough. Please use at least 8 characters.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting activation with:', { tokenId, email, verificationCode });
      
      const response = await agentInvitationsApi.activate({
        tokenId,
        email,
        verificationCode,
        password
      });
      
      console.log('Activation response:', response);
      
      // Redirect to login page with success message
      navigate('/login?activated=true');
    } catch (error) {
      console.error('Activation error:', error);
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';
        
        if (status === 400) {
          setError(message || 'Invalid activation details. Please verify your information.');
        } else if (status === 404) {
          setError('Invitation not found or expired. Please request a new invitation.');
        } else {
          setError(`Error (${status}): ${message}`);
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="activation-page">
      <div className="activation-container">
        <div className="logo-container">
          <img src={logo} alt="Support Hub Logo" className="logo" />
          <h1>Support Hub</h1>
        </div>
        
        {/* Debug information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info" style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px', fontSize: '12px' }}>
            <strong>Debug Info:</strong><br />
            Current URL: {window.location.href}<br />
            URL Token ID: {paramTokenId || 'none'}<br />
            Query token: {searchParams.get('token') || 'none'}<br />
            Query tokenId: {searchParams.get('tokenId') || 'none'}<br />
            Query activationToken: {searchParams.get('activationToken') || 'none'}<br />
            Query verificationToken: {searchParams.get('verificationToken') || 'none'}<br />
            Query id: {searchParams.get('id') || 'none'}<br />
            Hash: {window.location.hash || 'none'}<br />
            Final Token: {tokenId || 'none'}<br />
            Query Email: {queryEmail || 'none'}<br />
            Query Verification Code: {queryVerificationCode || 'none'}<br />
            All Query Params: {JSON.stringify(Object.fromEntries(searchParams))}<br />
            Current Step: {step}
          </div>
        )}
        
        {/* Help section for URL format issues */}
        {!tokenId && process.env.NODE_ENV === 'development' && (
          <div className="help-info" style={{ background: '#fff3cd', padding: '15px', marginBottom: '20px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.5' }}>
            <strong>🔧 Troubleshooting Activation Links:</strong><br />
            <p style={{ margin: '10px 0' }}>If you're seeing this error, the activation link format might not match our frontend routes. Expected URL formats:</p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li><code>http://localhost:5173/activate-account/{tokenId}</code></li>
              <li><code>http://localhost:5173/activate-account?token={tokenId}&email={email}</code></li>
              <li><code>http://localhost:5173/activation/{tokenId}</code></li>
              <li><code>http://localhost:5173/verify-invitation?tokenId={tokenId}</code></li>
            </ul>
            <p style={{ margin: '10px 0' }}>If your activation link looks different, please copy and paste it here to help us debug the issue.</p>
          </div>
        )}
        
        {step === 1 && (
          <>
            <h2>Verify Your Invitation</h2>
            <p className="instructions">
              Enter your email address and the verification code from the invitation email to continue.
            </p>
            
            <form onSubmit={handleVerifySubmit} className="activation-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter the code from your email"
                  required
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                type="submit" 
                className="verify-button" 
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          </>
        )}
        
        {step === 2 && (
          <>
            <h2>Create Your Password</h2>
            <p className="instructions">
              Create a secure password for your account.
            </p>
            
            <form onSubmit={handleActivationSubmit} className="activation-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                />
                <div className="password-strength-container">
                  <div className="strength-meter">
                    <div 
                      className={`strength-meter-fill strength-${passwordStrength.score}`}
                      style={{ width: `${passwordStrength.score * 20}%` }}
                    ></div>
                  </div>
                  <span className="strength-text">{passwordStrength.message}</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                type="submit" 
                className="activate-button" 
                disabled={isLoading || !passwordStrength.isValid || password !== confirmPassword}
              >
                {isLoading ? 'Activating...' : 'Activate Account'}
              </button>
            </form>
          </>
        )}
        
        <div className="back-to-login">
          <Link to="/login">Return to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AccountActivationPage; 