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
  console.log("ProjectModal Props:", { role, isBusinessOwner }); // Debugging log

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close Modal">
          &times;
        </button>
        <h2 className="modal-title">{isUpdate ? 'Update Project' : 'Add New Project'}</h2>
        <form className="modal-form" onSubmit={onSubmit}>
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
          {role === "ROLE_ADMIN" && isBusinessOwner === "yes" && ( // Corrected prop name
            <button
              type="submit"
              className={`modal-submit-button ${isUpdate ? 'update' : 'add'}`}
            >
              {isUpdate ? 'Update Project' : 'Add Project'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
