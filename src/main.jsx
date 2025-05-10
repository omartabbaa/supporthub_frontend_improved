import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/LoginContext.jsx';
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <UserProvider> 
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserProvider>
    </HelmetProvider>
  </React.StrictMode>
);
