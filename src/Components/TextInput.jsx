import React from 'react';

const TextInput = ({ value, onChange, placeholder, required = false }) => {
  return (
    <input
      value={value}
      onChange={onChange}
      required={required}
      type="text"
      placeholder={placeholder}
      className='input-question-title'
    />
  );
};

export default TextInput;