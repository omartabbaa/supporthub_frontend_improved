import React, { useState } from 'react';
import './LandingPage.css';
import image from '../assets/Landingpage/HowCanIHelpImage.png';
import Discord from '../assets/socialmedia/Discord.png';
import Youtube from '../assets/socialmedia/Youtube.png';
import Email from '../assets/socialmedia/Email.png';
import Admin from '../assets/Landingpage/homepage.png';

import { Link } from 'react-router-dom';
import Accordion from '../Components/Accordion';

const LandingPage = () => {
    return (
        <div className="landing-page">
            <header className="landing-page-header">
                <h1 className="landing-page-title">Changing support forever</h1>
                <div className="hero-text-container">   
                    <h1 className="hero-title">Welcome to Support Hub</h1>
                  
                </div>
            </header>
            <section className="hero">
                <Link to="/signup" className="cta-button">Start</Link>
                <div className="hero-image-container">
                    <img src={image} alt="Support Hub Hero" className="hero-image" />
                </div>
            </section>

            <main className="main-content">
                <div className="main-container">
                    <div className="accordion-container">
                        <h2 className="accordion-title">Everything in One Hub</h2>
                        
                        <Accordion  title="Question Management">
                            <p >SupportHub provides a platform for real-time question management, 
                            allowing you to efficiently handle and respond to inquiries as they come in.</p>
                        </Accordion>

                        <Accordion  title="Admin has access to Permissions & Control">
                            <p >Manage access and control with our robust permissions system, 
                            ensuring the right people have the right level of access to your support hub.</p>
                        </Accordion>

                        <Accordion  title="Centralized Management">
                            <p >Manage all your departments, projects, and team members through a single, 
                            easy-to-use interface. SupportHub brings your team together in one platform.</p>
                        </Accordion>
                    </div>
                    
              
                        <img src={Admin} alt="Support Hub Features" className="main-image" />
                
                </div>
            </main>

            <footer className="landing-page-footer">
                <h2 className="footer-title">Social Media Links</h2>
                <div className="social-media-links">
                    <a href="" target="_blank" rel="noopener noreferrer" className="social-media-link">
                        <img className='social-media-link' src={Discord} alt="Discord" />
                    </a>
                    <a href="" target="_blank" rel="noopener noreferrer" className="social-media-link">
                        <img className='social-media-link' src={Youtube} alt="Youtube" />
                    </a>
                    <a href="" target="_blank" rel="noopener noreferrer" className="social-media-link-email">
                        <img className='social-media-link-email' src={Email} alt="Email" />
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
