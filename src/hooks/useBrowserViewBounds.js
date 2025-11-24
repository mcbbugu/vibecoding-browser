import { useEffect, useCallback, useRef } from 'react';
import { calculateBrowserViewBounds } from '../utils/browserView';
import { electronAPI } from '../utils/electron';

export const useBrowserViewBounds = (containerRef, dependencies = []) => {
  const updateBounds = useCallback((delay = 0) => {
    const update = () => {
      const bounds = calculateBrowserViewBounds(containerRef);
      if (bounds && electronAPI.isAvailable()) {
        electronAPI.browserViewUpdateBounds(bounds);
      }
    };
    
    if (delay > 0) {
      return setTimeout(update, delay);
    } else {
      update();
      return null;
    }
  }, [containerRef]);

  useEffect(() => {
    const timer = updateBounds(350);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [updateBounds, ...dependencies]);

  const updateBoundsRef = useRef(updateBounds);
  updateBoundsRef.current = updateBounds;

  useEffect(() => {
    const handleResize = () => {
      updateBoundsRef.current();
    };

    const handleSidebarToggle = () => {
      updateBoundsRef.current(350);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  return { updateBounds };
};

