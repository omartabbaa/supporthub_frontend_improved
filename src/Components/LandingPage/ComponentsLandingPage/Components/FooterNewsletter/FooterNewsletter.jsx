import React from "react";
import "./FooterNewsletter.css";

const FooterNewsletter = () => {
  return (
    <div className="footer-newsletter">
      <h3>Subscribe to our newsletter</h3>
      <p>Stay updated with our latest features and news</p>
      <form className="newsletter-form">
        <input type="email" placeholder="Enter your email" />
        <button type="submit">Subscribe</button>
      </form>
    </div>
  );
};

export default FooterNewsletter;
