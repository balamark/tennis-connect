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
  onCancel 
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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="modal-icon success">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="modal-icon error">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="modal-icon info">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="modal-icon warning">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container ${type}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {getIcon()}
          
          <div className="modal-text">
            {title && <h3 className="modal-title">{title}</h3>}
            <p className="modal-message">{message}</p>
          </div>
        </div>
        
        <div className="modal-actions">
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
        </div>
      </div>
    </div>
  );
};

export default Modal; 