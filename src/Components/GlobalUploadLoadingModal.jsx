import React, { useEffect, useState } from 'react';
import { useUploadLoadingContext } from '../context/UploadLoadingContext';
import './GlobalUploadLoadingModal.css';

const GlobalUploadLoadingModal = () => {
  const { 
    isUploading, 
    uploadProgress, 
    aiLearningPhase, 
    isCompleted,
    uploadDetails,
    updatePhase 
  } = useUploadLoadingContext();
  
  const [countdown, setCountdown] = useState(3);

  // Add useEffect to handle AI learning phases
  useEffect(() => {
    if (isUploading) {
      const phases = [
        { phase: 'uploading', duration: 2000, message: 'Uploading your knowledge...' },
        { phase: 'parsing', duration: 3000, message: 'Parsing document structure...' },
        { phase: 'analyzing', duration: 4000, message: 'Analyzing content patterns...' },
        { phase: 'learning', duration: 3000, message: 'AI is learning from your data...' },
        { phase: 'integrating', duration: 2000, message: 'Integrating knowledge...' },
        { phase: 'finalizing', duration: 1000, message: 'Finalizing optimization...' }
      ];

      let currentPhaseIndex = 0;
      let phaseTimeout;

      const advancePhase = () => {
        if (currentPhaseIndex < phases.length - 1) {
          currentPhaseIndex++;
          updatePhase(currentPhaseIndex);
          phaseTimeout = setTimeout(advancePhase, phases[currentPhaseIndex].duration);
        }
      };

      // Start with first phase
      updatePhase(0);
      phaseTimeout = setTimeout(advancePhase, phases[0].duration);

      return () => {
        if (phaseTimeout) clearTimeout(phaseTimeout);
      };
    }
  }, [isUploading, updatePhase]);

  // Handle countdown when completed
  useEffect(() => {
    if (isCompleted) {
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isCompleted]);

  if (!isUploading && !isCompleted) return null;

  const phases = [
    "Uploading files...",
    "Analyzing content structure...",
    "Processing knowledge patterns...", 
    "Training AI neural networks...",
    "Integrating with existing knowledge...",
    "Optimizing response algorithms...",
    "Finalizing knowledge enhancement..."
  ];

  return (
    <div className="global-upload-modal-overlay">
      <div className={`global-upload-modal ${isCompleted ? 'completed' : ''}`}>
        <div className="upload-modal-header">
          <div className="upload-modal-title">
            <span className="upload-icon">{isCompleted ? '✅' : '📤'}</span>
            <div className="upload-text-info">
              <h3>{isCompleted ? 'Upload Complete!' : 'AI Learning in Progress'}</h3>
              <p>
                {isCompleted 
                  ? `Successfully uploaded "${uploadDetails.fileName}" to ${uploadDetails.projectName}` 
                  : `Uploading "${uploadDetails.fileName}" to ${uploadDetails.projectName}`
                }
              </p>
            </div>
          </div>
          <div className="upload-progress-text">
            {isCompleted ? (
              <div className="completion-countdown">
                <div>✓</div>
                <div className="countdown-text">Closing in {countdown}s</div>
              </div>
            ) : `${Math.round(uploadProgress)}%`}
          </div>
        </div>

        <div className="upload-progress-bar">
          <div 
            className={`upload-progress-fill ${isCompleted ? 'completed' : ''}`}
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>

        <div className="ai-learning-container-global">
          <div className="ai-learning-animation-global">
            {/* Neural Network Background */}
            <div className="neural-network-global">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`neural-node-global node-${i}`}>
                  <div className="node-pulse-global"></div>
                </div>
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`neural-connection-global connection-${i}`}></div>
              ))}
            </div>

            {/* Central AI Brain */}
            <div className="ai-brain-container-global">
              <div className="ai-brain-outer-global">
                <div className="ai-brain-inner-global">
                  <div className="brain-symbol-global">🧠</div>
                </div>
              </div>
              
              {/* Floating Particles */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`particle-global particle-${i}`}></div>
              ))}
            </div>

            {/* Data Streams */}
            <div className="data-streams-global">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`data-stream-global stream-${i}`}>
                  <div className="stream-particle-global"></div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Learning Status */}
          <div className="ai-learning-status-global">
            <div className="learning-phase-global">
              <h4 className="phase-title-global">
                {isCompleted ? "Knowledge successfully integrated!" : "AI Learning in Progress"}
              </h4>
              <p className="phase-description-global">
                {isCompleted ? (
                  "Your knowledge has been successfully processed and integrated into the AI system. It's now ready to enhance responses for this topic!"
                ) : (
                  "Could take a couple of minutes"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalUploadLoadingModal; 