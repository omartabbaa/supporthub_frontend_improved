// ProjectModal.js
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css'; // Ensure Modal.css is correctly imported

const ProjectModal = ({
  onClose,
  onSubmit,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectImage,
  setProjectImage,
  averageResponseTime,
  setAverageResponseTime,
  isUpdate,
  role,
  isBusinessOwner
}) => {
  console.log("ProjectModal Props:", { role, isBusinessOwner, isUpdate }); // Enhanced logging
  
  // State for image upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  // More flexible condition for when to show the button
  const showButton = () => {
    // Allow for different formats of role and isBusinessOwner
    const isAdmin = role === "ROLE_ADMIN" || role === "ADMIN";
    const hasOwnership = isBusinessOwner === "yes" || isBusinessOwner === true;
    
    console.log("Button visibility check:", { isAdmin, hasOwnership });
    return true; // Always show button regardless of role/ownership
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setProjectImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted");
    
    // Pass the selected file along with other data
    onSubmit(selectedFile);
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
    if (e.key === 'Enter' && !projectName.trim()) {
      e.preventDefault();
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Modal Header with single close button */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isUpdate ? 'Update Project' : 'Add New Project'}
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
          <form className="modal-form" id="project-modal-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div className="form-group">
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                autoFocus
                autoComplete="off"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="projectDescription">Project Description</label>
              <textarea
                id="projectDescription"
                placeholder="Enter project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows="3"
                required
                autoComplete="off"
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="form-group">
              <label>Project Image (Optional)</label>
              
              {/* Upload Mode Toggle */}
              <div className="upload-mode-toggle">
                <button
                  type="button"
                  className={`mode-toggle-btn ${uploadMode === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadMode('file')}
                >
                  📁 Upload File
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${uploadMode === 'url' ? 'active' : ''}`}
                  onClick={() => setUploadMode('url')}
                >
                  🔗 Use URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div className="file-upload-section">
                  {/* Drag and Drop Area */}
                  <div
                    className={`file-drop-area ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    
                    {imagePreview ? (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <div className="image-preview-overlay">
                          <button
                            type="button"
                            className="change-image-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            Change Image
                          </button>
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearImage();
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon">📷</div>
                        <div className="upload-text">
                          <p><strong>Click to upload</strong> or drag and drop</p>
                          <p>JPG, PNG, GIF, WebP (max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedFile && (
                    <div className="file-info">
                      <span className="file-name">📎 {selectedFile.name}</span>
                      <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="url-input-section">
                  <input
                    id="projectImage"
                    type="url"
                    placeholder="Enter image URL"
                    value={projectImage}
                    onChange={(e) => setProjectImage(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="averageResponseTime">Average Response Time</label>
              <input
                id="averageResponseTime"
                type="text"
                placeholder="e.g., 24 hours"
                value={averageResponseTime}
                onChange={(e) => setAverageResponseTime(e.target.value)}
                required
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
            form="project-modal-form"
            className={`modal-submit-button ${isUpdate ? 'update' : 'add'}`}
            disabled={!projectName.trim()}
            onClick={handleSubmit}
          >
            {isUpdate ? 'Update Project' : 'Add Project'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal as a portal to document.body to escape parent container positioning
  return createPortal(modalContent, document.body);
};

export default ProjectModal;
