// MobileNavbar.js
import './MobileNavbar.css';
import logo from '../assets/Logo/navbarLogo.png';
import { Link } from 'react-router-dom';
import BusinessIcon from '../assets/Button/navbar/BusinessIcon.png';
import AdminIcon from '../assets/Button/navbar/AdminIcon.png';
import NotificationIcon from '../assets/Button/navbar/NotificationIcon.png';
import { useState, useEffect, useRef } from 'react';
import { useUserContext } from "../context/LoginContext";
import axios from 'axios';
import ProfileDropdown from './ProfileDropdown';

const MobileNavbar = () => {
    const { logout, isLogin, role, stateBusinessId } = useUserContext();
    
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    const toggleNotification = () => setIsNotificationOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);
    const toggleMenu = () => setIsMenuOpen(prev => !prev);

    const closeDropdowns = (event) => {
        if (profileRef.current && !profileRef.current.contains(event.target)) {
            setIsProfileOpen(false);
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false); // Close menu on logout
    };

    const fetchBusinesses = async () => {
        if (!stateBusinessId) return;
        
        try {
            const response = await axios.get(`http://localhost:8080/api/businesses/${stateBusinessId}`);
            setBusinessName(response.data.name);
            console.log("Fetched business name:", response.data.name);
        } catch (error) {
            console.error("Error fetching business:", error);
        }
    };

    useEffect(() => {
        fetchBusinesses();
        document.addEventListener('mousedown', closeDropdowns);
        return () => {
            document.removeEventListener('mousedown', closeDropdowns);
        };
    }, [stateBusinessId]);

    useEffect(() => {
        console.log("Business id:", stateBusinessId);
    }, []);

    return (
        <nav className='mn-navbar'>
            <div className='mn-navbar__container'>
                <div className='mn-navbar__header'>
                    <Link to="/" onClick={() => setIsMenuOpen(false)}>
                        <img className='mn-navbar__logo' src={logo} alt="logo" />
                    </Link>
                    {/* Hamburger Icon */}
                    <button 
                        className={`mn-navbar__hamburger ${isMenuOpen ? 'mn-navbar__hamburger--open' : ''}`} 
                        onClick={toggleMenu} 
                        aria-label="Toggle navigation menu" 
                        aria-expanded={isMenuOpen}
                        aria-controls="mn-navbar__menu"
                    >
                        <span className="mn-navbar__bar"></span>
                        <span className="mn-navbar__bar"></span>
                        <span className="mn-navbar__bar"></span>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div 
                    className={`mn-navbar__menu ${isMenuOpen ? 'mn-navbar__menu--open' : ''}`} 
                    id="mn-navbar__menu"
                    aria-hidden={!isMenuOpen}
                >
                    <Link className='mn-navbar__link' to="/business-overview" onClick={() => setIsMenuOpen(false)}>
                        <img className='mn-navbar__icon' src={BusinessIcon} alt="Business Icon" />
                        Business
                    </Link>

                    {stateBusinessId && (
                        <Link 
                            className='mn-navbar__link' 
                            to={`/department-project-management/${stateBusinessId}/${businessName}`} 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {businessName || "My Business"}
                        </Link>
                    )}
                    
                    {/* Add Documentation Link */}
                    <Link className='mn-navbar__link' to="/documentation" onClick={() => setIsMenuOpen(false)}>
                        Documentation
                    </Link>
                 

                    {role === "ROLE_ADMIN" && (
                        <>
                            <Link className='mn-navbar__link' to="/admin-dashboard" onClick={() => setIsMenuOpen(false)}>
                                <img className='mn-navbar__icon' src={AdminIcon} alt="Admin Icon" />
                                Dashboard 
                            </Link>
                            <Link className='mn-navbar__link' to="/api-key-manager" onClick={() => setIsMenuOpen(false)}>
                                <img className='mn-navbar__icon' src={AdminIcon} alt="API Key Icon" />
                                API Keys
                            </Link>
                        </>
                    )}

                    {/* Notification Dropdown */}
                    {/**    <div className='mn-navbar__dropdown-container' ref={notificationRef}>
                        <button 
                            className='mn-navbar__dropdown-button' 
                            onClick={toggleNotification} 
                            aria-haspopup="true" 
                            aria-expanded={isNotificationOpen}
                        >
                            <img
                                className='mn-navbar__notification-icon'
                                src={NotificationIcon}
                                alt="Notification Icon"
                            />
                            Notifications
                        </button>
                        {isNotificationOpen && (
                            <div className='mn-navbar__notification-dropdown' role="menu" aria-label="Notifications">
                                <h3 className='mn-navbar__dropdown-title'>Notifications</h3>
                                <ul className='mn-navbar__dropdown-list'>
                                    <li className='mn-navbar__dropdown-item'>Notification 1</li>
                                    <li className='mn-navbar__dropdown-item'>Notification 2</li>
                                    <li className='mn-navbar__dropdown-item'>Notification 3</li>
                                </ul>
                            </div>
                        )}
                    </div>*/}
                 

                    {/* Profile Dropdown */}
                    <div className="mn-navbar__profile-dropdown-container" ref={profileRef}>
                      
                                <ProfileDropdown
                                    isOpen={isProfileOpen}
                                    onToggle={toggleProfile}
                                    onClose={() => setIsProfileOpen(false)}
                                    isLogin={isLogin}
                                    onLogout={handleLogout}
                                />
                      
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default MobileNavbar;
