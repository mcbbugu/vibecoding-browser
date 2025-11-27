import { useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { electronAPI } from '../utils/electron';

export const useShortcuts = () => {
  const { 
    setIsSearchOpen, 
    setActiveProjectId, 
    activeProjectId,
    openTabs,
    showToast,
    handleCmdSPress
  } = useApp();
  
  const lastTabDirectionRef = useRef(null);

  const handleShortcutAction = useCallback((action) => {
    switch (action) {
      case 'search':
        setIsSearchOpen(true);
        break;
      case 'close-tab':
        if (activeProjectId) {
          setActiveProjectId(null);
          showToast('Tab closed', 'info');
        }
        break;
      case 'reload':
        if (electronAPI.isAvailable()) {
          electronAPI.browserViewReload();
          showToast('Page reloaded', 'success');
        }
        break;
      case 'focus-url': {
        const addressInput = document.querySelector('[data-address-bar]');
        if (addressInput) {
          addressInput.focus();
          addressInput.select();
        }
        break;
      }
      case 'go-back':
        electronAPI.browserViewGoBack();
        break;
      case 'go-forward':
        electronAPI.browserViewGoForward();
        break;
      case 'cmd-s':
        handleCmdSPress();
        break;
      case 'find':
        if (electronAPI.isAvailable()) {
          electronAPI.browserViewFind('');
        }
        break;
      case 'next-tab':
        if (openTabs.length > 1) {
          const currentIndex = openTabs.indexOf(activeProjectId);
          if (currentIndex === -1) return;
          
          let nextIndex;
          if (lastTabDirectionRef.current === 'backward') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : openTabs.length - 1;
          } else {
            nextIndex = currentIndex < openTabs.length - 1 ? currentIndex + 1 : 0;
          }
          lastTabDirectionRef.current = 'forward';
          setActiveProjectId(openTabs[nextIndex]);
        }
        break;
      case 'prev-tab':
        if (openTabs.length > 1) {
          const currentIndex = openTabs.indexOf(activeProjectId);
          if (currentIndex === -1) return;
          
          let prevIndex;
          if (lastTabDirectionRef.current === 'forward') {
            prevIndex = currentIndex < openTabs.length - 1 ? currentIndex + 1 : 0;
          } else {
            prevIndex = currentIndex > 0 ? currentIndex - 1 : openTabs.length - 1;
          }
          lastTabDirectionRef.current = 'backward';
          setActiveProjectId(openTabs[prevIndex]);
        }
        break;
      default:
        break;
    }
  }, [activeProjectId, openTabs, setIsSearchOpen, setActiveProjectId, showToast, handleCmdSPress]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isModalOpen = document.querySelector('[class*="z-[9999]"]') !== null;
      
      if (isModalOpen) {
        return;
      }
      
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          handleShortcutAction('prev-tab');
        } else {
          handleShortcutAction('next-tab');
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleShortcutAction('find');
        return;
      }

      if (e.key === 'Escape') {
        if (electronAPI.isAvailable()) {
          electronAPI.browserViewStopFind('clearSelection');
        }
        return;
      }
      
      if (isInputFocused && !target.hasAttribute('data-address-bar')) {
        return;
      }

      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();
      const shortcuts = {
        't': 'search',
        'w': 'close-tab',
        'r': 'reload',
        'l': 'focus-url',
        's': 'cmd-s'
      };

      if (shortcuts[key]) {
        if (key === 'w' && isInputFocused) return;
        e.preventDefault();
        handleShortcutAction(shortcuts[key]);
        return;
      }

      if (e.key === '[' && isCmdOrCtrl) {
        e.preventDefault();
        handleShortcutAction('go-back');
        return;
      }
      if (e.key === ']' && isCmdOrCtrl) {
        e.preventDefault();
        handleShortcutAction('go-forward');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleShortcutAction]);

  useEffect(() => {
    if (!electronAPI.onGlobalShortcut) return undefined;
    const unsubscribe = electronAPI.onGlobalShortcut(handleShortcutAction);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [handleShortcutAction]);
};

