import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDemoMode } from '../contexts/DemoModeContext';

const DemoModeBanner = () => {
  const { t } = useTranslation();
  const { isDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="demo-mode-banner bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-blue-800">
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">i</span>
        </div>
        <p className="text-sm font-medium">
          {t('demo.banner')}
        </p>
      </div>
    </div>
  );
};

export default DemoModeBanner; 