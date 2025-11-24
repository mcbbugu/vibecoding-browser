import { useCallback } from 'react';
import { electronAPI } from '../utils/electron';

export const useScreenshot = (showToast, project) => {
  const captureScreenshot = useCallback(async () => {
    if (!electronAPI.isAvailable() || !project) return;
    
    try {
      const result = await electronAPI.captureScreenshot();
      if (result.success) {
        showToast('截图已保存到剪贴板', 'success');
      } else {
        showToast(`截图失败: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast(`截图失败: ${error.message}`, 'error');
    }
  }, [showToast, project]);

  return { captureScreenshot };
};

