// Accordion.js
"use client"
import React, { useState, useRef, useEffect } from 'react';
import './Accordion.css';
import Tooltip from './Tooltip';

const Accordion = ({ title, children, isOpen, onToggle, titleTooltip = null }) => {
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

    const headerContent = (
        <div 
            className="accordion-header" 
            onClick={onToggle}
        >
            <h3 className="accordion-title">{title} </h3>
            <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>
                {isOpen ? '▲' : '▼'}
            </span>
        </div>
    );

    return (
        <div className="accordion">
            {titleTooltip ? (
                <Tooltip text={titleTooltip}>{headerContent}</Tooltip>
            ) : (
                headerContent
            )}
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
