import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { electronAPI } from '../utils/electron';

export const useScreenshot = (showToast, project) => {
  const { t } = useTranslation();
  
  const captureScreenshot = useCallback(async () => {
    if (!electronAPI.isAvailable() || !project) return;
    
    try {
      const result = await electronAPI.captureScreenshot();
      if (result.success) {
        showToast(t('toast.screenshotSavedToClipboard'), 'success');
      } else {
        showToast(t('toast.screenshotFailed', { error: result.error }), 'error');
      }
    } catch (error) {
      showToast(t('toast.screenshotFailed', { error: error.message }), 'error');
    }
  }, [showToast, project, t]);

  return { captureScreenshot };
};

