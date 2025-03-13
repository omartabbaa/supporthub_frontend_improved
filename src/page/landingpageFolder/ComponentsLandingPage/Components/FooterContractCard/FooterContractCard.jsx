import React from "react";
import "./FooterContract.css";
import MailIcon from "../../images/icons/mail.svg";
import CallIcon from "../../images/icons/call.svg";

const FooterContractCard = () => {
  return (
    <div className="footer-contract-card">
      <h3>Contact Us</h3>
      <div className="contract-items">
        <div className="contract-item">
          <img src={MailIcon} alt="mail-icon" />
          <p>support@supporthub.com</p>
        </div>
        <div className="contract-item">
          <img src={CallIcon} alt="call-icon" />
          <p>+1 800 123 4567</p>
        </div>
      </div>
    </div>
  );
};

export default FooterContractCard;
