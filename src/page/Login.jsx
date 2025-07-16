import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './Login.css';
import { auth } from "../services/ApiService";
import { useUserContext } from "../context/LoginContext";
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, token } = useUserContext();
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (token) {
            setSuccessMessage("Login successful! Welcome back!");
            // Clear any previous errors
            setError(null);
        }
        
        // Check for password reset success
        const resetSuccess = searchParams.get('reset');
        if (resetSuccess === 'success') {
            setSuccessMessage("Password reset successful! You can now sign in with your new password.");
            setError(null);
        }
        
        // Check for account activation success
        const activationSuccess = searchParams.get('activation');
        if (activationSuccess === 'success') {
            setSuccessMessage("Account activated successfully! You can now sign in.");
            setError(null);
        }
    }, [token, searchParams]);

    const loginNow = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setSuccessMessage(null); // Clear previous success message

        // Validate if fields are empty
        if (!username) {
            setError("Please enter your email.");
            return;
        }
        if (!password) {
            setError("Please enter your password.");
            return;
        }

        try {
            // Use the centralized API service
            const response = await auth.login({ username, password });
            login(response.data.token || response.data.jwt);
            
        } catch (error) {
            // Check the error response to identify the issue
            if (error.response) {
                // Check for wrong email/password (assuming backend returns 401 status for this)
                if (error.response.status === 401) {
                    setError("Incorrect email or password. Please try again.");
                } else {
                    // Other error responses from the server
                    setError("Login failed. Please check your credentials.");
                }
            } else {
                // If no response, it's likely a network or system failure
                setError("System error. Please try again later.");
            }
            // Log full error for debugging
            console.error("Login failed:", error.response?.data || error.message);
        }
    };

    return (
        <>
            <Helmet>
                <title>Sign In to SavvyAI | Access Your AI Support Hub</title>
                <meta name="description" content="Securely sign in to your SavvyAI account to access AI-powered customer support tools, analytics, and intelligent support management features." />
                <meta name="keywords" content="login, SavvyAI login, AI customer support login, support hub login" />
                <link rel="canonical" href="https://savvyai.ai/login" />
                
                {/* OpenGraph tags for social sharing */}
                <meta property="og:title" content="Sign In to SavvyAI | AI-Powered Support Platform" />
                <meta property="og:description" content="Access your SavvyAI account to manage intelligent customer support" />
                <meta property="og:url" content="https://savvyai.ai/login" />
                <meta property="og:type" content="website" />
                
                {/* Structured data for login page */}
                <script type="application/ld+json">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "SavvyAI Sign In",
                        "description": "Sign in to access your SavvyAI account",
                        "breadcrumb": {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                {
                                    "@type": "ListItem",
                                    "position": 1,
                                    "name": "Home",
                                    "item": "https://savvyai.ai"
                                },
                                {
                                    "@type": "ListItem",
                                    "position": 2,
                                    "name": "Sign In",
                                    "item": "https://savvyai.ai/login"
                                }
                            ]
                        }
                    }
                `}
                </script>
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
                            <h1 className="auth-title">Welcome back</h1>
                            <p className="auth-subtitle">Sign in to your account to continue</p>
                        </div>

                        <form className="auth-form" onSubmit={loginNow}>
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
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        aria-required="true"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <div className="input-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input 
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        className="form-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        aria-required="true"
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="checkbox-label">
                                    <input type="checkbox" className="checkbox" />
                                    <span className="checkbox-text">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="forgot-link">
                                    Forgot password?
                                </Link>
                            </div>
                            
                            <button 
                                type="submit"
                                className="auth-button primary"
                                disabled={loading}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Sign In
                                    </>
                                )}
                            </button>
                            
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
                        </form>
                        
                        <div className="auth-footer">
                            <p className="auth-footer-text">
                                Don't have an account? 
                                <Link to="/signup" className="auth-link">
                                    Create one here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
