import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDemoMode } from '../contexts/DemoModeContext';

const DemoModeToggle = ({ className = '' }) => {
  const { t } = useTranslation();
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
        title={isDemoMode ? t('demo.currentlyDemo') : t('demo.currentlyLive')}
      >
        💡 {isDemoMode ? t('demo.toggle') : t('demo.liveMode')}
      </button>
    </div>
  );
};

export default DemoModeToggle; 