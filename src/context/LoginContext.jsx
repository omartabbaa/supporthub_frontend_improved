import { createContext, useState, useContext, useEffect } from "react";
import { decodeToken } from 'jsontokens';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [userId, setUserId] = useState('');
    const [stateBusinessId, setStateBusinessId] = useState(null); // Changed businessId to stateBusinessId

    useEffect(() => {
        const updateUserFromToken = () => {
            if (token) {
                localStorage.setItem("token", token);
                console.log("Token:", token);
                
                const decoded = decodeToken(token);
                
                setUser(decoded.payload?.sub); 
                setRole(decoded.payload?.role);
                setUserId(decoded.payload?.userId);
                setStateBusinessId(decoded.payload?.businessId); // Updated businessId to stateBusinessId
                
                setIsLogin(true);
                
                console.log("Role:", decoded.payload?.role);
                console.log("User ID:", decoded.payload?.sub);
                console.log("State Business ID:", decoded.payload?.businessId); // Updated log to stateBusinessId
            } else {
                localStorage.removeItem("token");
                setUser(null);
                setIsLogin(false);
                console.log("Login status updated: User is not logged in");
            }
            setLoading(false);
        };
        updateUserFromToken();
    }, [token]);

    // Log stateBusinessId whenever it changes to see updates
    useEffect(() => {
        console.log("Updated State Business ID:", stateBusinessId);
    }, [stateBusinessId]);

    const login = (newToken) => {
        setLoading(true);
        setToken(newToken);
        console.log("Login function called");
    };

    const logout = () => {
        setLoading(true);
        setToken(null);
        setIsLogin(false);
        console.log("Logout function called: User is logged out");
    };

    return (
        <UserContext.Provider value={{ stateBusinessId, userId, role, token, user, login, logout, loading, isLogin }}>
            {loading ? <p>Loading...</p> : children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
