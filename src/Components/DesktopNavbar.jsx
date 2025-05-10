import './navbar.css';
import logo from '../assets/Logo/navbarLogo.png';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BusinessIcon from '../assets/Button/navbar/BusinessIcon.png';
import AdminIcon from '../assets/Button/navbar/AdminIcon.png';
import NotificationIcon from '../assets/Button/navbar/NotificationIcon.png';
import { useState, useEffect, useRef } from 'react';
import { useUserContext } from "../context/LoginContext";
import { businesses as businessesApi, departments as departmentsApi } from '../services/ApiService';
import ProfileDropdown from './ProfileDropdown';
"use client"

const DesktopNavbar = () => {
    const { logout, isLogin, role, stateBusinessId } = useUserContext(); // Changed businessId to stateBusinessId
    
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const [business, setBusiness] = useState(null);
    const [expertiseAreas, setExpertiseAreas] = useState([]);

    const toggleNotification = () => setIsNotificationOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const closeDropdowns = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
        if (profileRef.current && !profileRef.current.contains(event.target)) {
            setIsProfileOpen(false);
        }
    };

    const handleLogout = () => logout();

    const fetchBusinesses = async () => {
        try {
            const response = await businessesApi.getById(stateBusinessId);
            setBusiness(response.data);
            setBusinessName(response.data.name);
            console.log("Fetched business name:", response.data.name);
            console.log("dfjjdsnfkjs",businessName)
        } catch (error) {
            console.error("Error fetching business:", error);
        }
    };

    const fetchExpertiseAreas = async () => {
        try {
            const response = await departmentsApi.getAll();
            // Filter departments by business ID
            const filteredAreas = response.data.filter(
                dept => dept.businessId === parseInt(stateBusinessId)
            ).map(dept => ({
                id: dept.departmentId || dept.id,
                name: dept.departmentName || dept.name || 'Unnamed Area'
            }));
            
            console.log("Fetched expertise areas for navbar:", filteredAreas);
            setExpertiseAreas(filteredAreas);
        } catch (err) {
            console.error("Error fetching expertise areas for navbar:", err);
        }
    };

    useEffect(() => {
        console.log("Business id:", stateBusinessId);
        if (stateBusinessId) {
            fetchBusinesses();
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
            <nav className='navbar' aria-label="Main Navigation">
                <div className='navbar-container'>
                    <div className='navbar-left'>
                        <Link to="/" aria-label="SupportHub Home Page">
                            <img className='logo-img' src={logo} alt="SupportHub Logo" width="150" height="40" />
                        </Link>

                        <Link 
                            className='navbar-link' 
                            to="/business-overview"
                            title="Manage your business accounts"
                        >
                            Business
                            <img className='business-icon' src={BusinessIcon} alt="" aria-hidden="true" width="16" height="16" />
                        </Link>

                        {stateBusinessId && (
                            <Link 
                                className='navbar-link' 
                                to={`/department-project-management/${stateBusinessId}/${businessName}`}
                                title={`Manage departments and projects for ${businessName}`}
                            >
                                {businessName || "My Business"}
                            </Link>
                        )}
                        
                        {stateBusinessId && businessName && expertiseAreas.length > 0 && (
                            <Link 
                                className='navbar-link' 
                                to={`/expertise-area/${Math.min(...expertiseAreas.map(area => area.id))}`}
                                title={`View the main expertise area for ${businessName}`}
                            >
                                {businessName} Home
                            </Link>
                        )}
                        
                        <Link 
                            className='navbar-link' 
                            to="/documentation"
                            title="Implementation guides and API documentation"
                        >
                            Documentation
                        </Link>

             
                    </div>
                    <div className='navbar-right'>
                        {role === "ROLE_ADMIN" && (
                            <>
                                <Link 
                                    className='navbar-link' 
                                    to="/admin-dashboard"
                                    title="Admin dashboard for system management"
                                >
                                    Dashboard 
                                    <img className='admin-icon' src={AdminIcon} alt="" aria-hidden="true" width="16" height="16" />
                                </Link>
                                <Link 
                                    className='navbar-link' 
                                    to="/api-key-manager"
                                    title="Manage API keys for integration"
                                >
                                    API Keys
                                    <img className='admin-icon' src={AdminIcon} alt="" aria-hidden="true" width="16" height="16" />
                                </Link>
                            </>
                        )}
                        {
                            /* <div className='dropdown-container' ref={notificationRef}>
                            <img
                                onClick={toggleNotification}
                                className='notification-icon'
                                src={NotificationIcon}
                                alt="NotificationIcon"
                            />
                            {isNotificationOpen && (
                                <div className='notification-dropdown'>
                                    <h3>Notifications</h3>
                                    <ul>
                                        <li>Notification 1</li>
                                        <li>Notification 2</li>
                                        <li>Notification 3</li>
                                    </ul>
                                </div>
                            )}
                        </div>*/
                        }
                        {/* Notification Dropdown */}
                       

                        {/* Profile Dropdown */}
                        <ProfileDropdown
                            isOpen={isProfileOpen}
                            onToggle={toggleProfile}
                            onClose={() => setIsProfileOpen(false)}
                            isLogin={isLogin}
                            onLogout={handleLogout}
                        />
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default DesktopNavbar;
