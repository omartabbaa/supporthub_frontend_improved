import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './Login.css';
import { auth } from "../services/ApiService";
import { useUserContext } from "../context/LoginContext";
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, token } = useUserContext();
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (token) {
            setSuccessMessage("Login successful! Welcome back!");
            // Clear any previous errors
            setError(null);
        }
    }, [token]);

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
                <title>Login to SupportHub | Access Your Support Dashboard</title>
                <meta name="description" content="Securely log in to your SupportHub account to access AI-powered customer support tools, analytics, and support management features." />
                <meta name="keywords" content="login, SupportHub login, customer support login, help desk login" />
                <link rel="canonical" href="https://yourdomain.com/login" />
                
                {/* OpenGraph tags for social sharing */}
                <meta property="og:title" content="Login to SupportHub | Customer Support Platform" />
                <meta property="og:description" content="Access your SupportHub account to manage AI-powered customer support" />
                <meta property="og:url" content="https://yourdomain.com/login" />
                <meta property="og:type" content="website" />
                
                {/* Structured data for login page */}
                <script type="application/ld+json">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "SupportHub Login",
                        "description": "Login to access your SupportHub account",
                        "breadcrumb": {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                {
                                    "@type": "ListItem",
                                    "position": 1,
                                    "name": "Home",
                                    "item": "https://yourdomain.com"
                                },
                                {
                                    "@type": "ListItem",
                                    "position": 2,
                                    "name": "Login",
                                    "item": "https://yourdomain.com/login"
                                }
                            ]
                        }
                    }
                `}
                </script>
            </Helmet>
            
            <div className="login-container" role="main" aria-labelledby="login-heading">
                <div className="login-title-form-container">
                    <h1 id="login-heading" className="login-title">Login to SupportHub</h1>
                    
                    {/* Form submission handled by onSubmit for cleaner code */}
                    <form 
                        className="login-form"
                        onSubmit={loginNow}
                        aria-label="Login form"
                    >
                        {/* Username input */}
                        <div className="form-field">
                            <label htmlFor="email" className="visually-hidden">Email</label>
                            <input 
                                id="email"
                                type="email"
                                placeholder="Email"
                                className="login-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                aria-required="true"
                                autoComplete="email"
                            />
                        </div>
                        
                        {/* Password input */}
                        <div className="form-field">
                            <label htmlFor="password" className="visually-hidden">Password</label>
                            <input 
                                id="password"
                                type="password"
                                placeholder="Password"
                                className="login-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-required="true"
                                autoComplete="current-password"
                            />
                        </div>
                        
                        {/* Submit button */}
                        <button 
                            type="submit"
                            className="login-button"
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        
                        {/* Success message */}
                        {successMessage && <p className="success-message" style={{ color: 'green' }} role="status">{successMessage}</p>}
                        
                        {/* Error message */}
                        {error && <p className="error-message" role="alert">{error}</p>}
                    </form>
                    
                    <p className="signup-link">
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Login;
