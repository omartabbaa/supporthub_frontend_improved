import './navbar.css';
// TODO: Replace with actual SavvyAI.ai logo
import logo from '../assets/Logo/navbarLogo.png'; // Replace with savvyai-logo.png
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
    const { logout, isLogin, role, stateBusinessId, userId, businessName, user } = useUserContext(); // Added userId, businessName, user
    
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const [business, setBusiness] = useState(null);
    const [expertiseAreas, setExpertiseAreas] = useState([]);

    const toggleNotification = () => setIsNotificationOpen(prev => !prev);
    const toggleProfile = () => {
        console.log('toggleProfile called, current state:', isProfileOpen);
        setIsProfileOpen(prev => {
            console.log('Setting isProfileOpen from', prev, 'to', !prev);
            return !prev;
        });
    };

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
            console.log("Fetched business data:", response.data);
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
            name: `${businessName} AI Hub`, // Updated naming for AI context
            url: `/department-project-management/${stateBusinessId}/${businessName}` 
        });
    }
    
    if (role === "ROLE_ADMIN") {
        navigationItems.push({ name: "AI Dashboard", url: "/admin-dashboard" }); // Updated for AI context
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
                            "url": ${JSON.stringify(navigationItems.map(item => `https://savvyai.ai${item.url}`))}
                        }
                    `}
                </script>
            </Helmet>
            <nav className='navbar' aria-label="SavvyAI Navigation">
                <div className='navbar-container'>
                    <div className='navbar-left'>
                        <Link to="/new-landing" aria-label="SavvyAI Home - AI Solutions Made Simple">
                            <img 
                                className='logo-img' 
                                src={logo} 
                                alt="SavvyAI - Making AI Accessible for Everyone" 
                                width="160" 
                                height="48" 
                            />
                        </Link>

                        {stateBusinessId && businessName && expertiseAreas.length > 0 && (
                            <Link 
                                className='navbar-link navbar-link--business-home' 
                                to={`/expertise-area/${Math.min(...expertiseAreas.map(area => area.id))}`}
                                title={`Access AI tools for ${businessName}`}
                            >
                                {businessName} AI Hub
                            </Link>
                        )}
                    </div>
                    <div className='navbar-right'>
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
