import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useUserContext } from "../context/LoginContext";
import './UploadYourOwnData.css';
import TextInput from '../Components/TextInput';
import TextArea from '../Components/TextArea';
import Tooltip from '../Components/Tooltip';
import axios from 'axios';

const UploadYourOwnData = () => {
  const { userId } = useUserContext();
  const navigate = useNavigate();
  // Get params from URL
  const { businessName, department, project, projectId } = useParams();
  
  const [files, setFiles] = useState([]);
  const [dataTitle, setDataTitle] = useState('');
  const [dataDescription, setDataDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // Decode params
  const decodedBusinessName = businessName ? decodeURIComponent(businessName) : "";
  const decodedDepartment = department ? decodeURIComponent(department) : "";
  const decodedProject = project ? decodeURIComponent(project) : "";

  useEffect(() => {
    // Set default title based on project
    if (decodedProject) {
      setDataTitle(`${decodedProject} - Knowledge Enhancement`);
    }
  }, [decodedProject]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
    
    return () => clearInterval(interval);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!dataTitle.trim()) {
      setError('Please provide a title for your data');
      return;
    }
    
    if (!projectId) {
      setError('Missing topic information');
      return;
    }
    
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      // Start progress simulation for UI feedback
      const clearProgressInterval = simulateUploadProgress();
      
      // Process each file individually - backend expects one file at a time
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress to show which file we're on
        setUploadProgress(Math.round((i / files.length) * 100));
        
        // Create FormData object for this file
        const formData = new FormData();
        
        // Match the exact field names expected by DocumentUploadInputDTO
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('documentTitle', dataTitle + (files.length > 1 ? ` (${i+1}/${files.length})` : ''));
        formData.append('documentDescription', dataDescription);
        formData.append('autoGenerateEmbeddings', 'true');
        
        // Send request to the correct API endpoint
        const response = await axios.post('http://localhost:8082/api/upload/document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            // For multiple files, calculate combined progress
            const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const overallProgress = Math.round(((i / files.length) * 100) + (fileProgress / files.length));
            setUploadProgress(Math.min(overallProgress, 99)); // Cap at 99% until complete
          }
        });
        
        console.log(`File ${i+1}/${files.length} upload successful:`, response.data);
      }
      
      // All files uploaded successfully
      clearProgressInterval();
      setUploadProgress(100);
      
      // Show success message
      setTimeout(() => {
        setSuccess(true);
        setDataTitle('');
        setDataDescription('');
        setFiles([]);
        
        // Automatically redirect after successful upload
        setTimeout(() => {
          navigate(`/question-overview/${businessName}/${department}/${project}/${projectId}`);
        }, 3000);
      }, 500);
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.response?.data?.error || 'Failed to upload files. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate total file size
  const totalFileSize = files.reduce((total, file) => total + file.size, 0);
  const formattedTotalSize = (totalFileSize / (1024 * 1024)).toFixed(2); // in MB

  return (
    <div className={`upload-data-page ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
      <div className="help-mode-toggle-container">
        <span className="help-mode-label">Help Mode</span>
        <button 
          className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
          onClick={() => setHelpModeEnabled(!helpModeEnabled)}
          data-tooltip="Toggle help tooltips on/off"
          data-tooltip-position="left"
        >
          <div className="help-mode-toggle-circle"></div>
          <span className="sr-only">Toggle help mode</span>
        </button>
      </div>

      <div className="breadcrumb-navigation">
        <button 
          className="back-button" 
          onClick={() => navigate(`/question-overview/${businessName}/${department}/${project}/${projectId}`)}
        >
          <span className="back-icon">←</span> Back to Topic
        </button>
        <div className="breadcrumb-trail">
          <span className="breadcrumb-item">{decodedBusinessName}</span> &gt; 
          <span className="breadcrumb-item">{decodedDepartment}</span> &gt; 
          <span className="breadcrumb-current">{decodedProject}</span>
        </div>
      </div>

      <header className="upload-data-header">
        <h1 className="upload-data-title">Teach AI with Your Data</h1>
        <p className="upload-data-subtitle">
          Upload your own files to enhance the AI's knowledge about <strong>{decodedProject}</strong>
        </p>
      </header>

      {success ? (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Upload Successful!</h2>
          <p>Your files have been uploaded and are being processed to teach the AI about <strong>{decodedProject}</strong>.</p>
          <p className="redirect-message">You will be redirected to the topic page shortly...</p>
        </div>
      ) : (
        <div className="upload-container">
          <div className="upload-steps">
            <div className="step active">
              <div className="step-number">1</div>
              <div className="step-label">Select Files</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${files.length > 0 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Add Details</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${isUploading ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Upload</div>
            </div>
          </div>
          
          <form className="upload-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>What are you teaching the AI?</h2>
              
              <div className="form-group" data-tooltip="Give a clear title that describes what knowledge you're adding">
                <label htmlFor="data-title">Knowledge Title *</label>
                <TextInput
                  id="data-title"
                  value={dataTitle}
                  onChange={(e) => setDataTitle(e.target.value)}
                  placeholder="e.g., Product Manual, Technical Documentation, Training Guide"
                  required
                />
              </div>
              
              <div className="form-group" data-tooltip="Explain what information these files contain and why they're useful">
                <label htmlFor="data-description">Description</label>
                <TextArea
                  id="data-description"
                  value={dataDescription}
                  onChange={(e) => setDataDescription(e.target.value)}
                  placeholder="Describe what information these files contain and how the AI should use it..."
                />
              </div>
            </div>
            
            <div className="form-section">
              <h2>Select Knowledge Files</h2>
              
              <div 
                className={`file-upload-container ${dragActive ? 'drag-active' : ''}`} 
                onDragEnter={handleDrag} 
                data-tooltip="Upload documents containing expertise knowledge about this topic"
              >
                <label 
                  htmlFor="file-upload" 
                  className="file-upload-box"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
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
                      <li key={index} className="file-item">
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
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{uploadProgress}% Uploaded</div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate(`/question-overview/${businessName}/${department}/${project}/${projectId}`)}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isUploading || files.length === 0}
                data-tooltip="Upload these files to improve AI responses"
              >
                {isUploading ? 'Uploading...' : 'Teach AI with these files'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UploadYourOwnData; 