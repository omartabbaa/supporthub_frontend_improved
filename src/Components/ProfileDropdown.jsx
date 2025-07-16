import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useUserContext } from "../context/LoginContext";
import './ProfileDropdown.css';

const ProfileDropdown = ({ isOpen, onToggle, onClose, isLogin, onLogout }) => {
    const dropdownRef = useRef(null);
    const { userId, role, businessName, user } = useUserContext();

    // Debug logging
    console.log('ProfileDropdown render:', { isOpen, isLogin, role, user });

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user && typeof user === 'string') {
            const nameParts = user.split(' ');
            if (nameParts.length >= 2) {
                return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
            }
            return user.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Format role display
    const formatRole = (role) => {
        if (!role) return 'User';
        return role.replace('ROLE_', '').charAt(0).toUpperCase() + 
               role.replace('ROLE_', '').slice(1).toLowerCase();
    };

    // Get user display name
    const getUserDisplayName = () => {
        if (user && typeof user === 'string') {
            return user;
        }
        return 'User';
    };

    const handleToggleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Profile button clicked, current isOpen:', isOpen);
        onToggle();
    };

    return (
        <div className='profile-container' ref={dropdownRef}>
            <button 
                onClick={handleToggleClick} 
                className='profile-button'
                aria-label="User profile menu"
                aria-expanded={isOpen}
                aria-haspopup="true"
                type="button"
            >
                <div className='profile-avatar'>
                    {getUserInitials()}
                </div>
                {isLogin && (
                    <span className='profile-name-display'>{getUserDisplayName()}</span>
                )}
                <svg 
                    className={`profile-chevron ${isOpen ? 'open' : ''}`} 
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && (
                <div className='profile-dropdown' role="menu">
                    {console.log('Rendering dropdown menu')}
                    {isLogin ? (
                        <>
                            {/* User Info Header */}
                            <div className='profile-dropdown-header'>
                                <div className='profile-dropdown-avatar'>
                                    {getUserInitials()}
                                </div>
                                <div className='profile-dropdown-info'>
                                    <div className='profile-dropdown-name'>{getUserDisplayName()}</div>
                                    <div className='profile-dropdown-role'>{formatRole(role)}</div>
                                    {businessName && (
                                        <div className='profile-dropdown-business'>{businessName}</div>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <div className='profile-dropdown-section'>
                                <Link to="/dashboard" className='profile-dropdown-item' onClick={onClose} role="menuitem">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                    </svg>
                                    Dashboard
                                </Link>

                                <Link to="/business-overview" className='profile-dropdown-item' onClick={onClose} role="menuitem">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                                    </svg>
                                    Business Overview
                                </Link>

                                {role === "ROLE_ADMIN" && (
                                    <Link to="/admin-dashboard" className='profile-dropdown-item' onClick={onClose} role="menuitem">
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                        </svg>
                                        Admin Dashboard
                                    </Link>
                                )}
                            </div>

                            {/* Account Settings */}
                            <div className='profile-dropdown-section'>
                                <div className='profile-dropdown-item' role="menuitem">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                    Account Settings
                                </div>

                                <div className='profile-dropdown-item' role="menuitem">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                                    </svg>
                                    Notifications
                                </div>

                                <Link to="/documentation" className='profile-dropdown-item' onClick={onClose} role="menuitem">
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    Help & Documentation
                                </Link>
                            </div>

                            {/* Logout */}
                            <div className='profile-dropdown-section profile-dropdown-section--danger'>
                                <button 
                                    className='profile-dropdown-item profile-dropdown-item--logout' 
                                    onClick={() => { onLogout(); onClose(); }}
                                    role="menuitem"
                                >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Not Logged In State */
                        <div className='profile-dropdown-guest'>
                            <div className='profile-dropdown-guest-header'>
                                <h3>Welcome to SavvyAI</h3>
                                <p>Sign in to access your AI-powered support hub</p>
                            </div>
                            
                            <div className='profile-dropdown-guest-actions'>
                                <Link to="/login" className='profile-dropdown-login-btn' onClick={onClose}>
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Sign In
                                </Link>
                                
                                <Link to="/signup" className='profile-dropdown-signup-btn' onClick={onClose}>
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                    </svg>
                                    Create Account
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;