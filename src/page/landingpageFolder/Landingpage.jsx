import React from 'react';
// Import the components with their new paths
import HomeBanner from './ComponentsLandingPage/HomeBanner';
import HomeOneFeatures from './ComponentsLandingPage/HomeOneFeatures';
import UsabilitySlider from './ComponentsLandingPage/UsabilitySlider';
import HomeOneMarketingSection from './ComponentsLandingPage/HomeMarketingSection';
import HomePricing from './ComponentsLandingPage/HomePricing';
import FooterOne from './ComponentsLandingPage/FooterOne';

const Landingpage = () => {
  return (
    <div className="landing-page">
      <HomeBanner />
      <HomeOneFeatures />
      <UsabilitySlider />
      <HomeOneMarketingSection />
      <HomePricing />
      <FooterOne />
    </div>
  );
};

export default Landingpage;
