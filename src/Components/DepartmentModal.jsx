// DepartmentModal.js
import React from 'react';
import { createPortal } from 'react-dom';
import './Modal.css'; // Ensure Modal.css is correctly imported
"use client"
const DepartmentModal = ({
  onClose,
  onSubmit,
  departmentName,
  setDepartmentName,
  departmentDescription,
  setDepartmentDescription,
  isUpdate
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleOverlayClick = (e) => {
    // Close modal if clicking on the overlay (outside the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent form submission on Enter if name is empty
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !departmentName.trim()) {
      e.preventDefault();
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Modal Header with single close button */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isUpdate ? 'Update Expertise Area' : 'Add New Expertise Area'}
          </h2>
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="Close Modal"
            type="button"
            style={{
              fontSize: '18px',
              fontWeight: 'normal',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1',
              userSelect: 'none'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <form className="modal-form" id="modal-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div className="form-group">
              <label htmlFor="departmentName">Expertise Area Name</label>
              <input
                id="departmentName"
                type="text"
                placeholder="Enter expertise area name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
                autoFocus
                autoComplete="off"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="departmentDescription">Description (Optional)</label>
              <textarea
                id="departmentDescription"
                placeholder="Describe what this expertise area covers..."
                value={departmentDescription}
                onChange={(e) => setDepartmentDescription(e.target.value)}
                rows="4"
                autoComplete="off"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer with buttons - outside modal-body */}
        <div className="modal-footer">
          <button
            type="button"
            className="modal-cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="modal-form"
            className={`modal-submit-button ${isUpdate ? 'update' : 'add'}`}
            disabled={!departmentName.trim()}
            onClick={handleSubmit}
          >
            {isUpdate ? 'Update Area' : 'Add Area'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal as a portal to document.body to escape parent container positioning
  return createPortal(modalContent, document.body);
};

export default DepartmentModal;
