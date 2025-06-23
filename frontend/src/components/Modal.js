import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success', 
  actionLabel = 'OK',
  onAction,
  cancelLabel,
  onCancel,
  retryLabel,
  onRetry 
}) => {
  if (!isOpen) return null;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      onClose();
    }
  };

  // Transform technical error messages into user-friendly ones
  const getUserFriendlyMessage = (rawMessage) => {
    if (!rawMessage) return 'An unexpected error occurred.';
    
    const message = rawMessage.toString();
    
    // Handle common error patterns
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'We encountered a technical issue on our end. Please try again in a moment.';
    }
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again to continue.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }
    if (message.includes('404') || message.includes('Not Found')) {
      return 'The requested information could not be found.';
    }
    if (message.includes('Network Error') || message.includes('Failed to fetch')) {
      return 'Unable to connect to our servers. Please check your internet connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    
    // If it's already user-friendly (no technical jargon), return as-is
    if (!message.includes('Error:') && !message.includes('status code') && 
        !message.includes('axios') && !message.includes('XMLHttpRequest')) {
      return message;
    }
    
    // Default fallback for unhandled technical errors
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="modal-icon success">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="modal-icon error">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="modal-icon info">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="modal-icon warning">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const displayMessage = getUserFriendlyMessage(message);
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container ${type}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {getIcon()}
          {title && <h2 className="modal-title">{title}</h2>}
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{displayMessage}</p>
        </div>
        
        <div className="modal-actions">
          {/* For error modals, show Try Again and Cancel */}
          {type === 'error' && (retryLabel || onRetry) ? (
            <>
              <button 
                className="modal-button secondary"
                onClick={handleCancel}
              >
                {cancelLabel || 'Cancel'}
              </button>
              <button 
                className="modal-button primary error"
                onClick={handleRetry}
              >
                {retryLabel || 'Try Again'}
              </button>
            </>
          ) : (
            <>
              {cancelLabel && (
                <button 
                  className="modal-button secondary"
                  onClick={handleCancel}
                >
                  {cancelLabel}
                </button>
              )}
              <button 
                className={`modal-button primary ${type}`}
                onClick={handleAction}
              >
                {actionLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal; 