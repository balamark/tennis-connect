import React from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';

const DemoModeToggle = ({ className = '' }) => {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className={`demo-mode-toggle ${className}`}>
      <button
        className={`toggle-switch ${isDemoMode ? 'demo-active' : 'live-active'} px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
          isDemoMode 
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
        onClick={toggleDemoMode}
        title={`Currently in ${isDemoMode ? 'demo' : 'live'} mode. Click to switch to ${isDemoMode ? 'live' : 'demo'} mode.`}
      >
        💡 {isDemoMode ? 'Demo Mode' : 'Live Mode'}
      </button>
    </div>
  );
};

export default DemoModeToggle; 