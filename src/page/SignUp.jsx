import './SignUp.css';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { auth } from '../services/ApiService';

const SignUp = () => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [description, setDescription] = useState('');
    const [logo, setLogo] = useState('');
    const [signUpSuccess, setSignUpSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Strip "ROLE_" prefix if present in the role selection
        const normalizedRole = role.replace('ROLE_', '');

        // Prepare data for UserInputDTO
        const userData = {
            name: username,
            email: email,
            role: normalizedRole, // Send without "ROLE_" prefix
            password: password
        };

        // Prepare data for BusinessInputDTO if role requires it
        let businessData = null;
        if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPPORT_AGENT') {
            if (!businessName || !description) {
                setError('Business name and description are required for Admin accounts');
                setLoading(false);
                return;
            }
            businessData = {
                name: businessName,
                description: description,
                logo: logo || null // Ensure null is sent if empty
            };
        }

        const requestData = {
            user: userData,
            business: businessData
        };

        // Log the exact data being sent
        console.log('Sending signup data:', JSON.stringify(requestData));
            
        // Direct axios call instead of using the ApiService
        try {
            const response = await auth.signup(requestData);
            
            console.log('User Created Response:', response.data);
            setSignUpSuccess(true);
            resetForm();
        } catch (error) {
            setSignUpSuccess(false);
            let errorMessage = 'An unexpected error occurred during sign up. Please try again.';
            
            console.error('Error object:', error);
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Response data:', error.response.data);
                console.error('Headers:', error.response.headers);
                
                if (error.response.status === 403) {
                    errorMessage = 'Access denied. Please check your signup details.';
                } else if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.status === 400) {
                    errorMessage = 'Invalid registration data. Please check your inputs.';
                } else if (error.response.status === 500) {
                    errorMessage = 'Server error. Please try again later or contact support.';
                }
            } else if (error.request) {
                console.error('Request was made but no response received');
                errorMessage = 'No response from server. Please check your internet connection.';
            } else {
                console.error('Error setting up request:', error.message);
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setRole('');
        setBusinessName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDescription('');
        setLogo('');
        setError('');
    };

    return (
        <>
            <Helmet>
                <title>Join SavvyAI | Create Your AI Support Hub Account</title>
                <meta name="description" content="Create a SavvyAI account to access AI-powered customer support tools, intelligent routing, and analytics dashboards. Start your journey with AI today." />
                <meta name="keywords" content="sign up, create account, SavvyAI, AI customer support, support platform" />
                <link rel="canonical" href="https://savvyai.ai/signup" />
                
                {/* OpenGraph tags for social sharing */}
                <meta property="og:title" content="Join SavvyAI | AI-Powered Customer Support" />
                <meta property="og:description" content="Create your SavvyAI account to transform your customer support with AI" />
                <meta property="og:url" content="https://savvyai.ai/signup" />
                <meta property="og:type" content="website" />
                
                {/* Structured data for signup page */}
                <script type="application/ld+json">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Join SavvyAI",
                        "description": "Create an account to access SavvyAI's AI-powered customer support platform",
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
                                    "name": "Sign Up",
                                    "item": "https://savvyai.ai/signup"
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
                    <div className="auth-card signup-card">
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
                            <h1 className="auth-title">Join SavvyAI</h1>
                            <p className="auth-subtitle">Create your account to get started with AI-powered support</p>
                        </div>

                        {error && (
                            <div className="alert alert-error" role="alert">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}
                        
                        {!signUpSuccess ? (
                            <form className="auth-form signup-form" onSubmit={handleSignUp}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="username" className="form-label">Full Name</label>
                                        <div className="input-group">
                                            <div className="input-icon">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                id="username"
                                                type="text"
                                                placeholder="Enter your full name"
                                                className="form-input"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                aria-required="true"
                                                autoComplete="name"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="role" className="form-label">Account Type</label>
                                        <div className="input-group">
                                            <div className="input-icon">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <select
                                                id="role"
                                                value={role}
                                                className="form-input select-input"
                                                onChange={(e) => setRole(e.target.value)}
                                                required
                                                aria-required="true"
                                            >
                                                <option value="">Choose your role</option>
                                                <option value="USER">Personal User</option>
                                                <option value="ADMIN">Business Admin</option>
                                                <option value="SUPPORT_AGENT">Support Agent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {(role === 'ADMIN' || role === 'SUPPORT_AGENT' || role === 'ROLE_ADMIN' || role === 'ROLE_SUPPORT_AGENT') && (
                                    <div className="business-section">
                                        <div className="section-header">
                                            <h3 className="section-title">Business Information</h3>
                                            <p className="section-subtitle">Tell us about your organization</p>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="businessName" className="form-label">Business Name</label>
                                            <div className="input-group">
                                                <div className="input-icon">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2V4zm2 0v12h8V4H6zm10 0v12a2 2 0 002-2V6a2 2 0 00-2-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <input
                                                    id="businessName"
                                                    type="text"
                                                    placeholder="Your business name"
                                                    className="form-input"
                                                    value={businessName}
                                                    onChange={(e) => setBusinessName(e.target.value)}
                                                    required
                                                    aria-required="true"
                                                    autoComplete="organization"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="description" className="form-label">Business Description</label>
                                            <textarea
                                                id="description"
                                                placeholder="Describe your business and what you do"
                                                className="form-input textarea-input"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                required
                                                aria-required="true"
                                                rows="3"
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="logo" className="form-label">Logo URL (Optional)</label>
                                            <div className="input-group">
                                                <div className="input-icon">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <input
                                                    id="logo"
                                                    type="url"
                                                    placeholder="https://your-business-logo.com/logo.png"
                                                    className="form-input"
                                                    value={logo}
                                                    onChange={(e) => setLogo(e.target.value)}
                                                    autoComplete="url"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="form-group">
                                    <label htmlFor="email" className="form-label">Email Address</label>
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
                                            placeholder="Enter your email address"
                                            className="form-input"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            aria-required="true"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
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
                                                placeholder="Create a strong password"
                                                className="form-input"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                aria-required="true"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                        <div className="input-group">
                                            <div className="input-icon">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="Confirm your password"
                                                className="form-input"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                aria-required="true"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className="auth-button primary signup-button"
                                    disabled={loading}
                                    aria-busy={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                            </svg>
                                            Create Account
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="success-container">
                                <div className="success-icon">
                                    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="success-title">Account Created Successfully!</h2>
                                <p className="success-message">
                                    Welcome to SavvyAI! Your account has been created and you can now sign in with your credentials.
                                </p>
                                <Link to="/login" className="auth-button primary">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Go to Sign In
                                </Link>
                            </div>
                        )}
                        
                        {!signUpSuccess && (
                            <div className="auth-footer">
                                <p className="auth-footer-text">
                                    Already have an account? 
                                    <Link to="/login" className="auth-link">
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;