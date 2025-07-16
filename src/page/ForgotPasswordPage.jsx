import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Reuse the login page styles
import { passwordReset } from '../services/ApiService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  
  // Step tracking: 1 = email entry, 2 = code verification, 3 = password reset
  const [step, setStep] = useState(1);
  
  // Form data
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Token data from backend
  const [tokenId, setTokenId] = useState(null);
  
  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Not enough characters',
    isValid: false
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    switch (score) {
      case 0:
      case 1:
        message = 'Very weak password';
        break;
      case 2:
        message = 'Weak password';
        break;
      case 3:
        message = 'Good password';
        break;
      case 4:
        message = 'Strong password';
        break;
      case 5:
        message = 'Very strong password';
        break;
      default:
        message = 'Password strength unknown';
    }
    
    setPasswordStrength({
      score,
      message,
      isValid: score >= 3 && password.length >= 6
    });
  };

  // Step 1: Request password reset
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!email.trim()) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await passwordReset.request(email);
      if (response.data && response.data.tokenId) {
        setTokenId(response.data.tokenId);
        setSuccessMessage('Password reset code sent to your email. Please check your inbox.');
        setStep(2);
      } else {
        setSuccessMessage('If an account with this email exists, you will receive a password reset code.');
        setStep(2);
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset code
  const handleCodeVerification = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!resetCode.trim()) {
      setError('Please enter the reset code from your email.');
      setLoading(false);
      return;
    }

    try {
      const verifyData = {
        tokenId: tokenId,
        email: email,
        resetCode: resetCode.toUpperCase()
      };

      const response = await passwordReset.verify(verifyData);
      
      if (response.data && response.data.valid) {
        setSuccessMessage('Reset code verified successfully. Please set your new password.');
        setStep(3);
      } else {
        setError(response.data?.message || 'Invalid reset code. Please check your email and try again.');
      }
    } catch (error) {
      console.error('Code verification failed:', error);
      setError('Invalid reset code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Please choose a stronger password.');
      setLoading(false);
      return;
    }

    try {
      const confirmData = {
        tokenId: tokenId,
        email: email,
        resetCode: resetCode,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };

      const response = await passwordReset.confirm(confirmData);
      
      if (response.data && response.data.success) {
        setSuccessMessage('Password reset successfully! You can now log in with your new password.');
        setTimeout(() => {
          navigate('/login?reset=success');
        }, 2000);
      } else {
        setError(response.data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    if (password) {
      checkPasswordStrength(password);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password | SavvyAI</title>
        <meta name="description" content="Reset your SavvyAI password securely" />
      </Helmet>
      
      <div className="auth-page">
        <div className="auth-background">
          <div className="auth-pattern"></div>
        </div>
        
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <div className="logo-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 2L30 9v14L16 30 2 23V9l14-7z" fill="url(#gradient)" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1e40af" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="logo-text">SavvyAI</span>
              </div>
              
              {step === 1 && (
                <>
                  <h1 className="auth-title">Reset your password</h1>
                  <p className="auth-subtitle">Enter your email address and we'll send you a reset code</p>
                </>
              )}
              
              {step === 2 && (
                <>
                  <h1 className="auth-title">Enter reset code</h1>
                  <p className="auth-subtitle">We've sent a 6-digit code to {email}</p>
                </>
              )}
              
              {step === 3 && (
                <>
                  <h1 className="auth-title">Set new password</h1>
                  <p className="auth-subtitle">Choose a strong password for your account</p>
                </>
              )}
            </div>

            {/* Step 1: Email Entry */}
            {step === 1 && (
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <div className="input-group">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input 
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="auth-button primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Code Verification */}
            {step === 2 && (
              <form className="auth-form" onSubmit={handleCodeVerification}>
                <div className="form-group">
                  <label htmlFor="resetCode" className="form-label">Reset code</label>
                  <div className="input-group">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input 
                      id="resetCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      className="form-input"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      required
                      style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="auth-button primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
                
                <div className="form-options" style={{ justifyContent: 'center' }}>
                  <button 
                    type="button"
                    className="forgot-link"
                    onClick={() => setStep(1)}
                  >
                    ← Back to email entry
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Password Reset */}
            {step === 3 && (
              <form className="auth-form" onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">New password</label>
                  <div className="input-group">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input 
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="form-input"
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  {newPassword && (
                    <div className={`password-strength ${passwordStrength.score >= 3 ? 'strong' : 'weak'}`}>
                      <div className="strength-bar">
                        <div 
                          className="strength-fill" 
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="strength-text">{passwordStrength.message}</span>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
                  <div className="input-group">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input 
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="auth-button primary"
                  disabled={loading || !passwordStrength.isValid}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
                
                <div className="form-options" style={{ justifyContent: 'center' }}>
                  <button 
                    type="button"
                    className="forgot-link"
                    onClick={() => setStep(2)}
                  >
                    ← Back to code verification
                  </button>
                </div>
              </form>
            )}
            
            {/* Success message */}
            {successMessage && (
              <div className="alert alert-success" role="status">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="alert alert-error" role="alert">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="auth-footer">
              <p className="auth-footer-text">
                Remember your password? 
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage; 