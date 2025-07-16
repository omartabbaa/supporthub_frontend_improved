import React, { createContext, useState, useContext } from 'react';

const SidebarContext = createContext();

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  // Default to 'userActions' (primary sidebar), 'widget' (secondary sidebar)
  const [activeSidebarType, setActiveSidebarType] = useState('userActions'); 

  return (
    <SidebarContext.Provider value={{ activeSidebarType, setActiveSidebarType }}>
      {children}
    </SidebarContext.Provider>
  );
}; 