import { useState, useEffect } from 'react';
import { electronAPI } from '../utils/electron';

export const useDevTools = (project) => {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    if (!electronAPI.isAvailable() || !project) return;

    const checkDevTools = async () => {
      const result = await electronAPI.browserViewIsDevToolsOpened();
      if (result) {
        setIsDevToolsOpen(result.isOpened || false);
      }
    };
    
    const interval = setInterval(checkDevTools, 500);
    return () => clearInterval(interval);
  }, [project?.id]);

  const toggleDevTools = async () => {
    if (!electronAPI.isAvailable()) return false;
    
    await electronAPI.browserViewDevTools();
    setTimeout(async () => {
      const result = await electronAPI.browserViewIsDevToolsOpened();
      if (result) {
        setIsDevToolsOpen(result.isOpened || false);
      }
    }, 100);
    
    return true;
  };

  return { isDevToolsOpen, toggleDevTools };
};

