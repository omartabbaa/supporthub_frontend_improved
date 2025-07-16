import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useUserContext } from "../context/LoginContext";
import { useUploadLoadingContext } from "../context/UploadLoadingContext";
import { projects as projectsApi, setAuthToken } from '../services/ApiService';
import './UploadYourOwnData.css';
import TextInput from '../Components/TextInput';
import TextArea from '../Components/TextArea';
import Tooltip from '../Components/Tooltip';

const UploadYourOwnData = ({
  isModalMode = false, // To distinguish between page and modal usage
  initialProjectId,
  initialProjectName,
  initialDepartmentName,
  initialBusinessName,
  onCloseModal, // Function to call when modal should close
  onUploadSuccess // Callback after successful upload
}) => {
  const { userId, role, token } = useUserContext();
  const { 
    isUploading, 
    uploadProgress, 
    startUpload, 
    updateProgress, 
    completeUpload,
    finishUpload 
  } = useUploadLoadingContext();
  const navigate = useNavigate();
  const params = useParams(); 

  // Determine context based on mode
  const currentProjectId = isModalMode ? initialProjectId : params.projectId;
  const currentProjectName = isModalMode ? initialProjectName : params.project;
  const currentDepartmentName = isModalMode ? initialDepartmentName : params.department;
  const currentBusinessName = isModalMode ? initialBusinessName : params.businessName;

  const [files, setFiles] = useState([]);
  const [dataTitle, setDataTitle] = useState('');
  const [dataDescription, setDataDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Decode params
  const decodedBusinessName = currentBusinessName ? decodeURIComponent(currentBusinessName) : "";
  const decodedDepartment = currentDepartmentName ? decodeURIComponent(currentDepartmentName) : "";
  const decodedProject = currentProjectName ? decodeURIComponent(currentProjectName) : "";

  console.log(`[UYOD ${currentProjectId || 'Page'}] Rendering. ModalMode: ${isModalMode}`, {
    currentProjectId,
    currentProjectName,
    currentDepartmentName,
    currentBusinessName,
    props: { isModalMode, initialProjectId, initialProjectName, initialDepartmentName, initialBusinessName, onCloseModal, onUploadSuccess }
  });

  useEffect(() => {
    if (token) {
      console.log(`[UYOD ${currentProjectId || 'Page'}] Token available.`);
      // Set default title based on project
      if (decodedProject && !dataTitle) { // Only set if dataTitle is not already user-set or persisted
        setDataTitle(`${decodedProject} - Knowledge Enhancement`);
        console.log(`[UYOD ${currentProjectId || 'Page'}] Default data title set: ${decodedProject} - Knowledge Enhancement`);
      }
    }
    // Reset form state when initial project ID changes (if it's a modal and props change)
    // or when the modal is first opened.
    if (isModalMode) {
      setFiles([]);
      // dataTitle is handled by the logic above to set a default based on decodedProject.
      // If the modal re-opens for the same project, user's title (if changed) should persist.
      // If it's a new project, decodedProject changes, and title updates.
      setDataDescription('');
      setSuccess(false);
      setError('');
      setSuccessMessage('');
      console.log(`[UYOD Modal ${currentProjectId}] Form state reset due to prop change or initial mount.`);
    }
  }, [token, decodedProject, currentProjectId, isModalMode]); // dataTitle removed from deps to avoid loop if user edits





  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log(`[UYOD ${currentProjectId || 'Page'}] Files selected:`, selectedFiles.map(f => f.name));
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (index) => {
    console.log(`[UYOD ${currentProjectId || 'Page'}] Removing file at index: ${index}`);
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      console.log(`[UYOD ${currentProjectId || 'Page'}] Files dropped:`, droppedFiles.map(f => f.name));
      setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`[UYOD ${currentProjectId || 'Page'}] handleSubmit called. Title: ${dataTitle}, Files: ${files.length}`);
    
    if (!dataTitle.trim()) {
      setError('Please provide a title for your data');
      console.warn(`[UYOD ${currentProjectId || 'Page'}] handleSubmit validation failed: No data title.`);
      return;
    }
    if (!currentProjectId) {
      setError('Missing topic information. Cannot upload.');
      console.warn(`[UYOD ${currentProjectId || 'Page'}] handleSubmit validation failed: No currentProjectId.`);
      return;
    }
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      console.warn(`[UYOD ${currentProjectId || 'Page'}] handleSubmit validation failed: No files selected.`);
      return;
    }

    // Start global upload process
    const firstFile = files[0];
    startUpload({
      fileName: firstFile.name,
      projectName: decodedProject,
      totalFiles: files.length,
      currentFile: 1
    });
    
    setError('');
    setSuccess(false); 
    setSuccessMessage('');

    try {
      setAuthToken(token);
      // For simplicity, let's assume one file upload at a time for now if using the old single file endpoint
      // Or adjust backend to handle multiple files with one title/description
      // This example will use the first file, assuming single file upload for `projectsApi.uploadProjectContext`
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('file', firstFile);
        
        // Include the title and description that the user entered
        formData.append('title', dataTitle);
        if (dataDescription.trim()) {
          formData.append('description', dataDescription);
        }

        console.log(`[UYOD ${currentProjectId}] Uploading file: ${firstFile.name}`);
        console.log(`[UYOD ${currentProjectId}] FormData contents - Title: ${dataTitle}, Description: ${dataDescription}`);
        
        const response = await projectsApi.uploadProjectContext(currentProjectId, formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          updateProgress(percentCompleted);
          console.log(`[UYOD ${currentProjectId}] Upload progress: ${percentCompleted}%`);
        });
        
        console.log(`[UYOD ${currentProjectId}] File upload response:`, response.data);
        setSuccess(true);
        setSuccessMessage(`File "${firstFile.name}" uploaded successfully! ${response.data?.message || ''}`);
        setFiles([]); // Clear files after successful upload
        // setDataTitle(''); // Optionally clear title
        // setDataDescription(''); // Optionally clear description

        // Complete the upload with success state
        completeUpload();

        if (onUploadSuccess) {
          onUploadSuccess(currentProjectId, response.data);
        }
      } else {
        // This case should be caught by validation, but as a fallback
        throw new Error("No files to upload despite passing validation.");
      }

    } catch (err) {
      console.error(`[UYOD ${currentProjectId}] Upload error:`, err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to upload file.';
      setError(errorMessage);
      setSuccess(false);
      finishUpload(); // Clear global upload state
    } finally {
      console.log(`[UYOD ${currentProjectId}] Upload process finished.`);
    }
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const formattedTotalSize = (totalSize / (1024 * 1024)).toFixed(2); // Size in MB

  const renderFormContent = () => {
    let submitButtonText = 'Upload Files';
    if (isUploading) {
      submitButtonText = 'AI is Learning...';
    } else if (success) {
      submitButtonText = 'Uploaded!';
    }

    return (
      <>
        <div className="form-section">
           <TextInput
              label="Data Title"
              id={`data-title-${currentProjectId}`} // Ensure unique ID
              value={dataTitle}
              onChange={(e) => setDataTitle(e.target.value)}
              placeholder="e.g., Product Specifications Update Q3"
              required
              tooltipText="A descriptive title for this set of knowledge documents."
              helpModeEnabled={helpModeEnabled}
            />
        </div>
        <div className="form-section">
          <TextArea
              label="Description (Optional)"
              id={`data-description-${currentProjectId}`} // Ensure unique ID
              value={dataDescription}
              onChange={(e) => setDataDescription(e.target.value)}
              placeholder="Briefly describe the content or purpose of these documents."
              rows={3}
              tooltipText="Add a short description for context."
              helpModeEnabled={helpModeEnabled}
            />
        </div>
        <div className="form-section">
          <h2>Select Knowledge Files</h2>
          <div
            className={`file-upload-container ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            data-tooltip="Upload documents containing expertise knowledge about this topic"
          >
            <label
              htmlFor={`file-upload-${currentProjectId}`} 
              className="file-upload-box"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id={`file-upload-${currentProjectId}`}
                onChange={handleFileChange}
                multiple
                className="file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.ppt,.pptx"
              />
              
              <div className="upload-icon-container">
                <div className="upload-icon">{dragActive ? '↓' : '+'}</div>
              </div>
              
              <div className="upload-text">
                <p className="upload-primary-text">
                  {dragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
                </p>
                <p className="file-types">
                  PDF, Word, Excel, PowerPoint, TXT, CSV, Markdown
                </p>
              </div>
            </label>
          </div>
          
          {files.length > 0 && (
            <div className="selected-files">
              <div className="files-header">
                <h3>Selected Files ({files.length})</h3>
                <span className="total-size">{formattedTotalSize} MB total</span>
              </div>
              
              <ul className="file-list">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="file-item">
                    <div className="file-icon">
                       {file.name.endsWith('.pdf') ? '📄' :
                       file.name.endsWith('.doc') || file.name.endsWith('.docx') ? '📝' :
                       file.name.endsWith('.xls') || file.name.endsWith('.xlsx') ? '📊' :
                       file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ? '📑' :
                       file.name.endsWith('.txt') || file.name.endsWith('.md') ? '📃' : '📁'}
                    </div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        {file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="remove-file-button"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="info-message">
          <div className="info-icon">ℹ️</div>
          <p>By uploading these files, you're making this information available to support AI-generated answers related to this topic.</p>
        </div>
        
        {isUploading && (
          <div className="upload-in-progress-message">
            <div className="upload-progress-icon">📤</div>
            <div className="upload-progress-text">
              <p><strong>Upload in progress!</strong></p>
              <p>You can safely close this {isModalMode ? 'modal' : 'page'} or navigate away. The upload will continue in the background and you'll see progress at the bottom of your screen.</p>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          {isModalMode && ( // Show close/cancel only in modal mode
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                console.log(`[UYOD Modal ${currentProjectId}] Close/Cancel button clicked.`);
                if (onCloseModal) onCloseModal();
              }}
              disabled={false} // Always allow closing - upload continues in background
            >
              {success ? 'Close' : isUploading ? 'Close (Upload continues)' : 'Cancel'}
            </button>
          )}
          <button
            type="submit"
            className="submit-button"
            disabled={isUploading || files.length === 0 || (isModalMode && success)} 
            data-tooltip="Upload these files to improve AI responses"
          >
            {submitButtonText}
          </button>
        </div>
      </>
    );
  };

  // If not modal mode, it's a full page
  if (!isModalMode) {
    return (
      <div className={`upload-your-own-data-page ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`} onDragEnter={handleDrag}>
        <div className="upload-page-header">
          <div className="breadcrumb-navigation">
            <button 
              className="back-button" 
              onClick={() => navigate(-1)} 
              aria-label="Go back"
              title={isUploading ? "Go back (Upload continues in background)" : "Go back"}
            >
              <span className="back-icon" aria-hidden="true">←</span> 
              {isUploading ? 'Back (Upload continues)' : 'Back'}
            </button>
            <div className="breadcrumb-trail">
              {decodedBusinessName && (
                <>
                  <span className="breadcrumb-item">Org:</span>
                  <span className="breadcrumb-value">{decodedBusinessName}</span>
                  <span className="breadcrumb-separator">/</span>
                </>
              )}
              {decodedDepartment && (
                <>
                  <span className="breadcrumb-item">Area:</span>
                  <span className="breadcrumb-value">{decodedDepartment}</span>
                  <span className="breadcrumb-separator">/</span>
                </>
              )}
              <span className="breadcrumb-item">Topic:</span>
              <span className="breadcrumb-current">{decodedProject}</span>
            </div>
          </div>
           <div className="page-title-bar">
            <h1>Enhance Knowledge for "{decodedProject}"</h1>
            <div className="help-mode-toggle-container page-level-help-toggle">
              <span className="help-mode-label">Help Mode</span>
              <button
                className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
                onClick={() => setHelpModeEnabled(!helpModeEnabled)}
                data-tooltip="Toggle help tooltips on/off"
                data-tooltip-position="left"
                aria-pressed={helpModeEnabled}
              >
                <div className="help-mode-toggle-circle"></div>
                <span className="sr-only">Toggle help mode</span>
              </button>
            </div>
          </div>
          <p className="page-description">Upload documents to provide more context and information for AI responses related to this topic.</p>
        </div>
        <form onSubmit={handleSubmit} className="upload-form-page">
          {renderFormContent()}
        </form>
        {dragActive && <div id="drag-file-element" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
      </div>
    );
  }

  // For modal mode, this component is embedded within UploadDataModal.
  // It renders only the form itself. UploadDataModal provides the modal header and chrome.
  return (
    <form onSubmit={handleSubmit} className="upload-form-modal-inner">
      {renderFormContent()}
    </form>
  );
};

export default UploadYourOwnData; 