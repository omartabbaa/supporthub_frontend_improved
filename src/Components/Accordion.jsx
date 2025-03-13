// Accordion.js
import React, { useState, useRef, useEffect } from 'react';
import './Accordion.css';

const Accordion = ({ title, children, isOpen, onToggle }) => {
    const [height, setHeight] = useState('0px');
    const contentRef = useRef(null);

    useEffect(() => {
        const contentEl = contentRef.current;

        if (!contentEl) return;

        const updateHeight = () => {
            if (isOpen) {
                const scrollHeight = contentEl.scrollHeight;
                setHeight(`${scrollHeight}px`);
            } else {
                setHeight('0px');
            }
        };

        updateHeight();

        // Initialize ResizeObserver to watch for content changes
        const resizeObserver = new ResizeObserver(() => {
            updateHeight();
        });

        resizeObserver.observe(contentEl);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isOpen, children]);

    return (
        <div className="accordion">
            <div className="accordion-header" onClick={onToggle}>
                <h3 className="accordion-title">{title}</h3>
                <div className={`accordion-icon ${isOpen ? 'open' : ''}`}>
                    {/* You can use an icon here */}
                    {isOpen ? '−' : '+'}
                </div>
            </div>
            <div
                ref={contentRef}
                style={{ maxHeight: `${height}` }}
                className={`accordion-content ${isOpen ? 'open' : ''}`}
            >
                {children}
            </div>
        </div>
    );
};

export default Accordion;
