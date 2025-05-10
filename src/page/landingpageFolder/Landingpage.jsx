import React from 'react';
import { Helmet } from 'react-helmet-async';
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
      <Helmet>
        {/* Primary Meta Tags */}
        <title>SupportHub - AI-Powered Customer Support with Smart Routing</title>
        <meta name="description" content="Revolutionize support with AI-powered instant answers, smart routing to experts, and continuous learning. Reduce costs while improving customer satisfaction." />
        
        {/* Technical SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://yourdomain.com/" />
        
        {/* Open Graph - For Facebook, LinkedIn sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:title" content="SupportHub - AI-Powered Customer Support" />
        <meta property="og:description" content="AI-powered 24/7 assistance with instant answers and smart routing to experts. Continuous learning from every interaction." />
        <meta property="og:image" content="https://yourdomain.com/assets/og-image-optimized.jpg" />
        <meta property="og:site_name" content="SupportHub" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SupportHub - AI-Powered Customer Support" />
        <meta name="twitter:description" content="AI-powered 24/7 assistance with instant answers and smart routing to experts." />
        <meta name="twitter:image" content="https://yourdomain.com/twitter-image.jpg" />
        
        {/* Additional SEO tags */}
        <meta name="keywords" content="support, customer service, help desk, ticketing system" />
        <meta name="author" content="Your Company Name" />
        
        {/* Add image structured data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Support Hub - Your Complete Support Solution",
              "description": "Streamline your customer support operations with our all-in-one platform. Increase efficiency and customer satisfaction.",
              "image": {
                "@type": "ImageObject",
                "url": "https://yourdomain.com/assets/hero-image-optimized.jpg",
                "width": "1200",
                "height": "800",
                "caption": "SupportHub AI customer support platform interface"
              }
            }
          `}
        </script>

        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "SupportHub",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "USD",
              "lowPrice": "0",
              "highPrice": "249",
              "offerCount": "4"
            },
            "description": "AI-powered customer support with smart routing, expert assistance, and continuous learning",
            "featureList": "AI Learning Support, Instant Responses, Smart Query Routing, Expert Email Notifications, Direct Customer Replies, Admin Control"
          }
        `}
        </script>
      </Helmet>
      
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
