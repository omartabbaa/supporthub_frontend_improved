import React from 'react';
import Navbar from './navbar'; // Assuming you want the same navbar as in App.jsx for landing pages
// You might have a different Footer or other specific components for the landing layout
// import Footer from './Footer';

const LandingLayout = ({ children }) => {
  return (
    <div className="landing-layout">
      {/* <Navbar /> You might place Navbar here if it's specific to LandingLayout 
                  and not globally in App.jsx, or if you want a different Navbar */}
      <main>{children}</main>
      {/* <Footer /> */}
    </div>
  );
};

export default LandingLayout; 