import './SignUp.css';
import { useState } from 'react';
import axios from 'axios';

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
        <div className="signup-container">
            <div className="signup-title-form-container">
                <h1 className="signup-title">Sign Up</h1>
                {error && <p className="error-message">{error}</p>}
                <form className="signup-form" onSubmit={handleSignUp}>
                    <input
                        type="text"
                        placeholder="Username"
                        className="signup-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <select
                        value={role}
                        className="signup-select"
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="">Select Role</option>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPPORT_AGENT">Support Agent</option>
                    </select>
                    {(role === 'ADMIN' || role === 'SUPPORT_AGENT' || role === 'ROLE_ADMIN' || role === 'ROLE_SUPPORT_AGENT') && (
                        <>
                            <input
                                type="text"
                                placeholder="Business Name"
                                className="signup-input"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                required
                            />
                            <textarea
                                placeholder="Description"
                                className="signup-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                            <input
                                type="url"
                                placeholder="Logo URL"
                                className="signup-input"
                                value={logo}
                                onChange={(e) => setLogo(e.target.value)}
                            />
                        </>
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        className="signup-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="signup-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="signup-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="submit" 
                        className="signup-button"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>
                {signUpSuccess && (
                    <p className="signup-success-message">
                        Sign up successful! You can now log in with your credentials.
                    </p>
                )}
            </div>
        </div>
    );
};

export default SignUp;