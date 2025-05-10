import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { agentInvitations as agentInvitationsApi } from '../services/ApiService';
import './AccountActivationPage.css';
import logo from '../assets/Logo/navbarLogo.png';

const AccountActivationPage = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await agentInvitationsApi.verify({
        tokenId,
        email,
        verificationCode
      });
      
      if (response.data) {
        setStep(2); // Move to password creation step
      } else {
        setError('Verification failed. Please check your code and try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('An error occurred during verification. Please try again.');
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
      await agentInvitationsApi.activate({
        tokenId,
        email,
        verificationCode,
        password
      });
      
      // Redirect to login page with success message
      navigate('/login?activated=true');
    } catch (error) {
      console.error('Activation error:', error);
      setError('An error occurred during account activation. Please try again.');
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