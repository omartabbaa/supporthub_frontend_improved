import React, { createContext, useContext, useState } from 'react';

const UploadLoadingContext = createContext();

export const useUploadLoadingContext = () => {
  const context = useContext(UploadLoadingContext);
  if (!context) {
    throw new Error('useUploadLoadingContext must be used within UploadLoadingProvider');
  }
  return context;
};

export const UploadLoadingProvider = ({ children }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiLearningPhase, setAiLearningPhase] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [uploadDetails, setUploadDetails] = useState({
    fileName: '',
    projectName: '',
    totalFiles: 0,
    currentFile: 1
  });

  const startUpload = (details) => {
    setIsUploading(true);
    setUploadProgress(0);
    setAiLearningPhase(0);
    setIsCompleted(false);
    setUploadDetails(details);
  };

  const updateProgress = (progress) => {
    setUploadProgress(progress);
  };

  const updatePhase = (phase) => {
    setAiLearningPhase(phase);
  };

  const completeUpload = () => {
    setUploadProgress(100);
    setAiLearningPhase(6); // Final phase
    setIsCompleted(true);
    setIsUploading(false);
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      finishUpload();
    }, 3000);
  };

  const finishUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setAiLearningPhase(0);
    setIsCompleted(false);
    setUploadDetails({
      fileName: '',
      projectName: '',
      totalFiles: 0,
      currentFile: 1
    });
  };

  const value = {
    isUploading,
    uploadProgress,
    aiLearningPhase,
    isCompleted,
    uploadDetails,
    startUpload,
    updateProgress,
    updatePhase,
    completeUpload,
    finishUpload
  };

  return (
    <UploadLoadingContext.Provider value={value}>
      {children}
    </UploadLoadingContext.Provider>
  );
}; 