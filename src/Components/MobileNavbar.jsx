// MobileNavbar.js
import './MobileNavbar.css';
import logo from '../assets/Logo/navbarLogo.png';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BusinessIcon from '../assets/Button/navbar/BusinessIcon.png';
import AdminIcon from '../assets/Button/navbar/AdminIcon.png';
import NotificationIcon from '../assets/Button/navbar/NotificationIcon.png';
import { useState, useEffect, useRef } from 'react';
import { useUserContext } from "../context/LoginContext";
import axios from 'axios';
import ProfileDropdown from './ProfileDropdown';
import { departments as departmentsApi } from '../services/ApiService';


const MobileNavbar = () => {
    const { logout, isLogin, role, stateBusinessId } = useUserContext();
    
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const [expertiseAreas, setExpertiseAreas] = useState([]);

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
        } catch (error) {
            console.error("Error fetching business:", error);
        }
    };

    const fetchExpertiseAreas = async () => {
        try {
            const response = await departmentsApi.getAll();
            const filteredAreas = response.data.filter(
                dept => dept.businessId === parseInt(stateBusinessId)
            ).map(dept => ({
                id: dept.departmentId || dept.id,
                name: dept.departmentName || dept.name || 'Unnamed Area'
            }));
            
            console.log("Fetched expertise areas for mobile navbar:", filteredAreas);
            setExpertiseAreas(filteredAreas);
        } catch (err) {
            console.error("Error fetching expertise areas for mobile navbar:", err);
        }
    };

    useEffect(() => {
        fetchBusinesses();
        if (stateBusinessId) {
            fetchExpertiseAreas();
        }
        document.addEventListener('mousedown', closeDropdowns);
        return () => {
            document.removeEventListener('mousedown', closeDropdowns);
        };
    }, [stateBusinessId]);

    // Build navigation items array for structured data
    const navigationItems = [
        { name: "Home", url: "/" },
        { name: "Business Overview", url: "/business-overview" },
        { name: "Documentation", url: "/documentation" }
    ];
    
    if (stateBusinessId && businessName) {
        navigationItems.push({ 
            name: businessName, 
            url: `/department-project-management/${stateBusinessId}/${businessName}` 
        });
    }
    
    if (role === "ROLE_ADMIN") {
        navigationItems.push({ name: "Admin Dashboard", url: "/admin-dashboard" });
        navigationItems.push({ name: "API Key Manager", url: "/api-key-manager" });
    }

    return (
        <header role="banner">
            <Helmet>
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SiteNavigationElement",
                            "name": ${JSON.stringify(navigationItems.map(item => item.name))},
                            "url": ${JSON.stringify(navigationItems.map(item => `https://yourdomain.com${item.url}`))}
                        }
                    `}
                </script>
            </Helmet>
            <nav className='mn-navbar' aria-label="Main Navigation">
                <div className='mn-navbar__container'>
                    <div className='mn-navbar__header'>
                        <Link to="/" onClick={() => setIsMenuOpen(false)} aria-label="SupportHub Home Page">
                            <img 
                                className='mn-navbar__logo' 
                                src={logo} 
                                alt="SupportHub Logo" 
                                width="120" 
                                height="35" 
                            />
                        </Link>
                        
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

                    <div 
                        className={`mn-navbar__menu ${isMenuOpen ? 'mn-navbar__menu--open' : ''}`} 
                        id="mn-navbar__menu"
                        aria-hidden={!isMenuOpen}
                        role="menu"
                    >
                        <Link 
                            className='mn-navbar__link' 
                            to="/business-overview" 
                            onClick={() => setIsMenuOpen(false)}
                            role="menuitem"
                            title="Manage your business accounts"
                        >
                            <img className='mn-navbar__icon' src={BusinessIcon} alt="" aria-hidden="true" width="16" height="16" />
                            Business
                        </Link>

                        {stateBusinessId && (
                            <Link 
                                className='mn-navbar__link' 
                                to={`/department-project-management/${stateBusinessId}/${businessName}`} 
                                onClick={() => setIsMenuOpen(false)}
                                role="menuitem"
                                title={`Manage departments and projects for ${businessName}`}
                            >
                                {businessName || "My Business"}
                            </Link>
                        )}
                        
                        <Link 
                            className='mn-navbar__link' 
                            to="/documentation" 
                            onClick={() => setIsMenuOpen(false)}
                            role="menuitem"
                            title="Implementation guides and API documentation"
                        >
                            Documentation
                        </Link>
                    
                        {isLogin && stateBusinessId && (
                            <Link 
                                className='mn-navbar__link' 
                                to="/business-overview" 
                                onClick={() => setIsMenuOpen(false)}
                                role="menuitem"
                                title="Browse all expertise areas"
                            >
                                Expertise Areas
                            </Link>
                        )}

                        {role === "ROLE_ADMIN" && (
                            <>
                                <Link 
                                    className='mn-navbar__link' 
                                    to="/admin-dashboard" 
                                    onClick={() => setIsMenuOpen(false)}
                                    role="menuitem"
                                    title="Admin dashboard for system management"
                                >
                                    <img className='mn-navbar__icon' src={AdminIcon} alt="" aria-hidden="true" width="16" height="16" />
                                    Dashboard 
                                </Link>
                                <Link 
                                    className='mn-navbar__link' 
                                    to="/api-key-manager" 
                                    onClick={() => setIsMenuOpen(false)}
                                    role="menuitem"
                                    title="Manage API keys for integration"
                                >
                                    <img className='mn-navbar__icon' src={AdminIcon} alt="" aria-hidden="true" width="16" height="16" />
                                    API Keys
                                </Link>
                            </>
                        )}

                        {stateBusinessId && businessName && expertiseAreas.length > 0 && (
                            <Link 
                                className='mn-navbar__link' 
                                to={`/expertise-area/${Math.min(...expertiseAreas.map(area => area.id))}`}
                                onClick={() => setIsMenuOpen(false)}
                                role="menuitem"
                                title={`View the main expertise area for ${businessName}`}
                            >
                                <span className="nav-icon">🏢</span>
                                {businessName} Home
                            </Link>
                        )}

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
        </header>
    );
};

export default MobileNavbar;
