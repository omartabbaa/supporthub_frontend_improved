import React from 'react'
import "./FooterOne.css";
import FooterOneMenuList from "./FooterOneMenuList";
import FooterContractCard from "./Components/FooterContractCard/FooterContractCard";
import FooterNewsletter from './Components/FooterNewsletter/FooterNewsletter';

// Use inline SVG for logo instead of importing
const FooterLogo = (
  <svg xmlns="http://www.w3.org/2000/svg" width="150" height="40" viewBox="0 0 150 40">
    <text x="10" y="25" fill="#00cec9" fontWeight="bold" fontSize="20">SupportHub</text>
  </svg>
);

// Inline SVG icons for social media
const facebookIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#38b2ac">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
);

const twitterIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
  </svg>
);

const instagramIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const linkedinIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#00cec9">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const FooterOne = () => {
  // Define social links directly in the component
  const FooterSocialLinks = [
    {
      title: "Facebook",
      icon: facebookIcon,
      url: "https://facebook.com"
    },
    {
      title: "Twitter",
      icon: twitterIcon,
      url: "https://twitter.com"
    },
    {
      title: "Instagram",
      icon: instagramIcon,
      url: "https://instagram.com"
    },
    {
      title: "LinkedIn",
      icon: linkedinIcon,
      url: "https://linkedin.com"
    }
  ];

  return (
    <footer className="footer-section">
      <div className="container">
        {/* Footer top */}
        <div className="footer-top">
          <div className="row">
            {/* Brand and info column */}
            <div className="col-lg-3 col-md-12">
              <div className="footer-brand">
                {FooterLogo}
                <p className="footer-brand-text">
                  AI-powered customer support platform that helps businesses reduce response times and improve customer satisfaction.
                </p>
              </div>
            </div>
            
            {/* Menu links column - moved to center */}
            <div className="col-lg-5 col-md-6">
              <FooterOneMenuList />
            </div>
            
            {/* Contact form column */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-contact-form">
                <h4>Get in Touch</h4>
                <form>
                  <div className="contact-form-group">
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" placeholder="Your name" />
                  </div>
                  <div className="contact-form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" placeholder="Your email address" />
                  </div>
                  <div className="contact-form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" rows="3" placeholder="Your message"></textarea>
                  </div>
                  <button type="submit" className="contact-form-submit">Send Message</button>
                </form>
              </div>
            </div>
          </div>
          
          {/* Social links now below main content */}
          <div className="footer-social-container">
            <ul className="footer-social-links">
              {FooterSocialLinks.map((item, i) => (
                <li key={i}>
                  <a href={item.url} className="social-icon" target="_blank" rel="noreferrer">
                    {item.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Footer bottom */}
        <div className="footer-bottom">
          <div className="container">
            <div className="row">
              <div className="col-md-6 order-md-1 order-2">
                <div className="footer-copyright">
                  <p className="mb-0">© 2024 <a href="#">SupportHub</a>. All rights reserved.</p>
                </div>
              </div>
              <div className="col-md-6 order-md-2 order-1">
                <ul className="privacy-menu">
                  <li>
                    <a href="/terms">Terms and Conditions</a>
                  </li>
                  <li>
                    <a href="/privacy-policy">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="#">Cookies</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterOne;
