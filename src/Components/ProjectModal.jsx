// ProjectModal.js
import React from 'react';
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
  
  // More flexible condition for when to show the button
  const showButton = () => {
    // Allow for different formats of role and isBusinessOwner
    const isAdmin = role === "ROLE_ADMIN" || role === "ADMIN";
    const hasOwnership = isBusinessOwner === "yes" || isBusinessOwner === true;
    
    console.log("Button visibility check:", { isAdmin, hasOwnership });
    return true; // Always show button regardless of role/ownership
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted");
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close Modal">
          &times;
        </button>
        <h2 className="modal-title">{isUpdate ? 'Update Project' : 'Add New Project'}</h2>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="projectName">Project Name</label>
            <input
              id="projectName"
              type="text"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
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
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="projectImage">Project Image URL</label>
            <input
              id="projectImage"
              type="url"
              placeholder="Enter image URL"
              value={projectImage}
              onChange={(e) => setProjectImage(e.target.value)}
            />
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
            />
          </div>
          {/* Show button always for now to debug */}
          <button
            type="submit"
            className={`modal-submit-button ${isUpdate ? 'update' : 'add'}`}
          >
            {isUpdate ? 'Update Project' : 'Add Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
