import { createContext, useState, useContext, useEffect } from "react";
import { decodeToken } from 'jsontokens';
import { QuestionCountProvider } from './QuestionCountContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [userId, setUserId] = useState('');
    const [stateBusinessId, setStateBusinessId] = useState(null);
    const [subscriptionPlanId, setSubscriptionPlanId] = useState(null);
    const [businessName, setBusinessName] = useState('');

    useEffect(() => {
        const updateUserFromToken = () => {
            if (token) {
                localStorage.setItem("token", token);
                console.log("Token:", token);
                
                const decoded = decodeToken(token);
                const payload = decoded.payload;
                
                setUser(payload?.sub); 
                setRole(payload?.role);
                setUserId(payload?.userId);
                setStateBusinessId(payload?.businessId);
                setSubscriptionPlanId(payload?.subscriptionPlanId);
                setBusinessName(payload?.businessName);
                
                setIsLogin(true);
                
                console.log("Role:", payload?.role);
                console.log("User ID:", payload?.sub);
                console.log("State Business ID:", payload?.businessId);
                console.log("Subscription Plan ID:", payload?.subscriptionPlanId);
                console.log("Business Name:", payload?.businessName);
            } else {
                localStorage.removeItem("token");
                setUser(null);
                setIsLogin(false);
                setSubscriptionPlanId(null);
                setBusinessName('');
                console.log("Login status updated: User is not logged in");
            }
            setLoading(false);
        };
        updateUserFromToken();
    }, [token]);

    // Log state changes
    useEffect(() => {
        console.log("Updated State Business ID:", stateBusinessId);
        console.log("Updated Subscription Plan ID:", subscriptionPlanId);
    }, [stateBusinessId, subscriptionPlanId]);

    const login = (newToken) => {
        setLoading(true);
        setToken(newToken);
        console.log("Login function called");
    };

    const logout = () => {
        setLoading(true);
        setToken(null);
        setIsLogin(false);
        setSubscriptionPlanId(null);
        setBusinessName('');
        console.log("Logout function called: User is logged out");
    };

    const contextValue = {
        stateBusinessId,
        userId,
        role,
        token,
        user,
        login,
        logout,
        loading,
        isLogin,
        subscriptionPlanId,
        businessName
    };

    return (
        <UserContext.Provider value={contextValue}>
            <QuestionCountProvider>
                {loading ? <p>Loading...</p> : children}
            </QuestionCountProvider>
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
