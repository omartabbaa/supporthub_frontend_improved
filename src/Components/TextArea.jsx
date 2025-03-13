import React from 'react';
import './TextArea.css'; // Create this CSS file for any specific styles

const TextArea = ({ value, onChange, placeholder, required }) => {
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="textarea-question"
        ></textarea>
    );
};

export default TextArea;