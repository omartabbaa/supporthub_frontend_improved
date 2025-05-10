import './SignUp.css';
import { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

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
            const response = await axios.post('http://localhost:8082/api/users/signup', requestData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
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
                <title>Sign Up for SupportHub | Join Our AI-Powered Support Platform</title>
                <meta name="description" content="Create a SupportHub account to access AI-powered customer support tools, intelligent routing, and analytics dashboards. Start your 30-day free trial today." />
                <meta name="keywords" content="sign up, create account, SupportHub, AI customer support, support platform" />
                <link rel="canonical" href="https://yourdomain.com/signup" />
                
                {/* OpenGraph tags for social sharing */}
                <meta property="og:title" content="Sign Up for SupportHub | AI-Powered Customer Support" />
                <meta property="og:description" content="Create your SupportHub account to transform your customer support with AI" />
                <meta property="og:url" content="https://yourdomain.com/signup" />
                <meta property="og:type" content="website" />
                
                {/* Structured data for signup page */}
                <script type="application/ld+json">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Sign Up for SupportHub",
                        "description": "Create an account to access SupportHub's AI-powered customer support platform",
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
                                    "name": "Sign Up",
                                    "item": "https://yourdomain.com/signup"
                                }
                            ]
                        }
                    }
                `}
                </script>
            </Helmet>
            
            <div className="signup-container" role="main" aria-labelledby="signup-heading">
                <div className="signup-title-form-container">
                    <h1 id="signup-heading" className="signup-title">Create Your SupportHub Account</h1>
                    {error && <p className="error-message" role="alert">{error}</p>}
                    
                    {!signUpSuccess ? (
                        <form className="signup-form" onSubmit={handleSignUp} aria-label="Sign up form">
                            <div className="form-field">
                                <label htmlFor="username" className="visually-hidden">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Username"
                                    className="signup-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    aria-required="true"
                                    autoComplete="name"
                                />
                            </div>
                            
                            <div className="form-field">
                                <label htmlFor="role" className="visually-hidden">Select Role</label>
                                <select
                                    id="role"
                                    value={role}
                                    className="signup-select"
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                    aria-required="true"
                                >
                                    <option value="">Select Role</option>
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPPORT_AGENT">Support Agent</option>
                                </select>
                            </div>
                            
                            {(role === 'ADMIN' || role === 'SUPPORT_AGENT' || role === 'ROLE_ADMIN' || role === 'ROLE_SUPPORT_AGENT') && (
                                <>
                                    <div className="form-field">
                                        <label htmlFor="businessName" className="visually-hidden">Business Name</label>
                                        <input
                                            id="businessName"
                                            type="text"
                                            placeholder="Business Name"
                                            className="signup-input"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            required
                                            aria-required="true"
                                            autoComplete="organization"
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <label htmlFor="description" className="visually-hidden">Description</label>
                                        <textarea
                                            id="description"
                                            placeholder="Description"
                                            className="signup-input"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            aria-required="true"
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <label htmlFor="logo" className="visually-hidden">Logo URL</label>
                                        <input
                                            id="logo"
                                            type="url"
                                            placeholder="Logo URL"
                                            className="signup-input"
                                            value={logo}
                                            onChange={(e) => setLogo(e.target.value)}
                                            autoComplete="url"
                                        />
                                    </div>
                                </>
                            )}
                            
                            <div className="form-field">
                                <label htmlFor="email" className="visually-hidden">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    className="signup-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    aria-required="true"
                                    autoComplete="email"
                                />
                            </div>
                            
                            <div className="form-field">
                                <label htmlFor="password" className="visually-hidden">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    className="signup-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    aria-required="true"
                                    autoComplete="new-password"
                                />
                            </div>
                            
                            <div className="form-field">
                                <label htmlFor="confirmPassword" className="visually-hidden">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm Password"
                                    className="signup-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    aria-required="true"
                                    autoComplete="new-password"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="signup-button"
                                disabled={loading}
                                aria-busy={loading}
                            >
                                {loading ? 'Processing...' : 'Sign Up'}
                            </button>
                        </form>
                    ) : (
                        <div className="success-container" role="status">
                            <p className="signup-success-message">
                                Sign up successful! You can now log in with your credentials.
                            </p>
                            <Link to="/login" className="login-link">Go to Login</Link>
                        </div>
                    )}
                    
                    {!signUpSuccess && (
                        <p className="login-link-container">
                            Already have an account? <Link to="/login" className="login-link">Log in</Link>
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default SignUp;