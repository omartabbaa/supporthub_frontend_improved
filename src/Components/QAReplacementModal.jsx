import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Papa from 'papaparse';
import { questions as questionsApi } from '../services/ApiService';
import './Modal.css';
import './QAReplacementModal.css';

const QAReplacementModal = ({
  onClose,
  projectId,
  projectName,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: format explanation, 2: file upload
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef(null);

  const csvFormatExample = `Question ID,Title,Question Text,Status,Created Date,Answer Count,Answers
,"How to login?","I need help with logging into my account",ANSWERED,2024-01-15,2,"Click on the login button at the top right; Enter your email and password"
2,"Reset password","How can I reset my password?",NEW,2024-01-16,1,"Go to the forgot password link on the login page"
,"Account setup","Help with setting up my account",HANDOFF_INITIATED,2024-01-17,0,""

Note: Question ID column can be left empty for auto-generation, or you can specify custom IDs.
Created Date column is ignored by the system but can be included for reference.`;

  // CSV Header Validation
  const validateCsvHeaders = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        preview: 1,              // Only read the header row
        header: false,           
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            return reject('CSV file appears to be empty or invalid.');
          }

          const headers = results.data[0].map(h => h?.trim() || '');
          
          // Expected header mapping for your CSV export format
          const requiredHeaders = [
            { position: 0, expected: 'Question ID', required: false },
            { position: 1, expected: 'Title', required: true }, // Maps to questionTitle
            { position: 2, expected: 'Question Text', required: true },
            { position: 3, expected: 'Status', required: true },
            { position: 4, expected: 'Created Date', required: false }, // Ignored by backend
            { position: 5, expected: 'Answer Count', required: true },
            { position: 6, expected: 'Answers', required: false } // Maps to answers list
          ];

          // Check minimum number of required headers
          if (headers.length < 6) {
            return reject(`CSV must have at least 6 columns. Found only ${headers.length} columns.`);
          }

          // Validate each required header position
          for (const { position, expected, required } of requiredHeaders) {
            if (position < headers.length) {
              if (headers[position] !== expected) {
                return reject(`Header #${position + 1} must be exactly "${expected}" (found "${headers[position]}").`);
              }
            } else if (required) {
              return reject(`Missing required header #${position + 1}: "${expected}".`);
            }
          }

          resolve(); // Headers are valid
        },
        error: (err) => reject(`Error reading CSV file: ${err.message}`)
      });
    });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['text/csv', 'application/csv', '.csv'];
    const isCSV = file.type === 'text/csv' || 
                  file.type === 'application/csv' || 
                  file.name.toLowerCase().endsWith('.csv');
    
    if (!isCSV) {
      setError('Please select a valid CSV file');
      return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('CSV file size must be less than 10MB');
      return;
    }

    // Validate CSV headers
    setIsValidating(true);
    try {
      await validateCsvHeaders(file);
      setSelectedFile(file);
      setError(''); // Clear any previous errors
    } catch (headerError) {
      setError(`❌ Header Validation Failed: ${headerError}`);
      setSelectedFile(null); // Don't accept the file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

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

  const clearFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const response = await questionsApi.replaceWithCSV(
        projectId,
        selectedFile,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      );

      // Success
      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err) {
      console.error('Q&A replacement failed:', err);
      setError(err.response?.data?.message || 'Failed to replace Q&A. Please check your CSV format and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isUploading) {
      onClose();
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Question ID,Title,Question Text,Status,Created Date,Answer Count,Answers
,"Sample Question 1","This is an example question",NEW,2024-01-15,2,"First answer example; Second answer example"
1,"Sample Question 2","Another example question",ANSWERED,2024-01-16,1,"Single answer example"
,"Sample Question 3","Question with auto-generated ID",HANDOFF_INITIATED,2024-01-17,0,""`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const modalContent = (
    <div className="modal-overlay qa-replacement-modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content qa-replacement-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 1 ? 'Replace Q&A - CSV Format' : 'Upload CSV File'}
          </h2>
          <button 
            className="close-button" 
            onClick={onClose} 
            disabled={isUploading}
            aria-label="Close Modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="format-explanation">
              <div className="warning-section">
                <div className="warning-icon">⚠️</div>
                <div className="warning-text">
                  <strong>Warning:</strong> This will replace ALL existing questions and answers for "{projectName}". This action cannot be undone.
                </div>
              </div>

              <h3>Required CSV Format:</h3>
              <p><strong>⚠️ IMPORTANT:</strong> Your CSV file must include the following columns with <strong>EXACT</strong> header names in this precise order:</p>
              
              <div className="format-table">
                <table>
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Description</th>
                      <th>Required</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Question ID</td>
                      <td>Unique identifier for each question (leave empty for auto-generation)</td>
                      <td>No</td>
                      <td>1, 2, 3... or empty</td>
                    </tr>
                    <tr>
                      <td>Title</td>
                      <td>Short title for the question</td>
                      <td>Yes</td>
                      <td>"How to login?"</td>
                    </tr>
                    <tr>
                      <td>Question Text</td>
                      <td>Full question description</td>
                      <td>Yes</td>
                      <td>"I need help with logging in"</td>
                    </tr>
                    <tr>
                      <td>Status</td>
                      <td>Status of the question</td>
                      <td>Yes</td>
                      <td>OPEN, CLOSED, PENDING, ANSWERED, HANDOFF_INITIATED, NEW</td>
                    </tr>
                    <tr>
                      <td>Created Date</td>
                      <td>Creation date (ignored by system)</td>
                      <td>No</td>
                      <td>Any date or empty</td>
                    </tr>
                    <tr>
                      <td>Answer Count</td>
                      <td>Number of answers provided</td>
                      <td>Yes</td>
                      <td>0, 1, 2, 3...</td>
                    </tr>
                    <tr>
                      <td>Answers</td>
                      <td>Answer texts (can be multiple in one column or separate columns)</td>
                      <td>No</td>
                      <td>"Click the login button"</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Example CSV Format:</h3>
              <div className="example-csv">
                <pre>{csvFormatExample}</pre>
              </div>

              <div className="format-notes">
                <h4>Important Notes:</h4>
                <ul>
                  <li><strong>CRITICAL:</strong> Headers must be EXACTLY: "Question ID", "Title", "Question Text", "Status", "Created Date", "Answer Count", "Answers"</li>
                  <li><strong>🎯 Client Validation:</strong> Headers will be checked immediately when you select a file</li>
                  <li>Question ID is optional - leave empty for auto-generation, or specify custom IDs</li>
                  <li>Created Date column is ignored by the system but must be present</li>
                  <li>Use double quotes around text that contains commas</li>
                  <li>Status must be exactly: OPEN, CLOSED, PENDING, ANSWERED, HANDOFF_INITIATED, or NEW (case-sensitive)</li>
                  <li>Answer Count should match the number of provided answers</li>
                  <li>Answers can be separated by semicolons in one column or use multiple answer columns</li>
                  <li>First row must be the header row with exact column names</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>

              <div className="template-download">
                <div style={{ 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <strong>🚨 IMPORTANT:</strong> Use the template below to ensure correct headers!<br/>
                  <small>Old CSV files may have incorrect column names.</small>
                </div>
                <button 
                  className="download-template-btn"
                  onClick={downloadTemplate}
                  type="button"
                >
                  📥 Download Template CSV
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="file-upload-section">
              <div className="project-info">
                <strong>Project:</strong> {projectName}
              </div>

              {error && (
                <div className="error-message">
                  {error}
                  {error.includes('Header Validation Failed') && (
                    <div style={{ marginTop: '12px', fontSize: '14px' }}>
                      <strong>💡 Quick Fix:</strong>
                      <br />• Download the template above to get correct headers
                      <br />• Ensure your CSV starts with: "Question ID,Title,Question Text,Status,Created Date,Answer Count,Answers"
                      <br />• Remove any extra columns before the 7th position
                    </div>
                  )}
                </div>
              )}

              <div 
                className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,application/csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {!selectedFile && !isValidating ? (
                  <div className="drop-zone-content">
                    <div className="upload-icon">📄</div>
                    <p>Drag and drop your CSV file here</p>
                    <p>or</p>
                    <button 
                      type="button"
                      className="select-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select CSV File
                    </button>
                  </div>
                ) : isValidating ? (
                  <div className="drop-zone-content">
                    <div className="upload-icon">⏳</div>
                    <p>Validating CSV headers...</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Checking that your file has the correct column structure
                    </p>
                  </div>
                ) : (
                  <div className="selected-file-info">
                    <div className="file-icon">📄</div>
                    <div className="file-details">
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                      <div className="file-validation-status" style={{ 
                        color: '#28a745', 
                        fontSize: '12px',
                        fontWeight: '500',
                        marginTop: '4px'
                      }}>
                        ✅ Headers validated successfully
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="remove-file-btn"
                      onClick={clearFile}
                      disabled={isUploading}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    Replacing Q&A... {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 && (
            <>
              <button 
                className="cancel-btn"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button 
                className="next-btn"
                onClick={() => setStep(2)}
                type="button"
              >
                I Understand - Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button 
                className="back-btn"
                onClick={() => setStep(1)}
                disabled={isUploading}
                type="button"
              >
                ← Back
              </button>
              <button 
                className="cancel-btn"
                onClick={onClose}
                disabled={isUploading}
                type="button"
              >
                Cancel
              </button>
              <button 
                className="upload-btn"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                type="button"
              >
                {isUploading ? 'Replacing...' : 'Replace Q&A'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QAReplacementModal; 