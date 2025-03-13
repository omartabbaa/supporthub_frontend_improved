// DepartmentModal.js
import React from 'react';
import './Modal.css'; // Ensure Modal.css is correctly imported

const DepartmentModal = ({
  onClose,
  onSubmit,
  departmentName,
  setDepartmentName,
  departmentDescription,
  setDepartmentDescription,
  isUpdate
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close Modal">
          &times;
        </button>
        <h2 className="modal-title">{isUpdate ? 'Update Department' : 'Add New Department'}</h2>
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="departmentName">Department Name</label>
            <input
              id="departmentName"
              type="text"
              placeholder="Enter department name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="departmentDescription">Department Description</label>
            <textarea
              id="departmentDescription"
              placeholder="Enter department description"
              value={departmentDescription}
              onChange={(e) => setDepartmentDescription(e.target.value)}
              rows="3"
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className={`modal-submit-button ${isUpdate ? 'update' : 'add'}`}
          >
            {isUpdate ? 'Update Department' : 'Add Department'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
