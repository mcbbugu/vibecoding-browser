import { useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { electronAPI } from '../utils/electron';

export const useShortcuts = () => {
  const { 
    setIsSearchOpen, 
    setActiveProjectId, 
    activeProjectId,
    showToast,
    handleCmdSPress
  } = useApp();

  const handleShortcutAction = useCallback((action) => {
    switch (action) {
      case 'search':
        setIsSearchOpen(true);
        break;
      case 'new-tab':
        setActiveProjectId(null);
        showToast('New tab opened', 'success');
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
      default:
        break;
    }
  }, [activeProjectId, setIsSearchOpen, setActiveProjectId, showToast, handleCmdSPress]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInputFocused && !target.hasAttribute('data-address-bar')) {
        return;
      }

      if (!(e.metaKey || e.ctrlKey)) return;

      const key = e.key.toLowerCase();
      const shortcuts = {
        'k': 'search',
        't': 'new-tab',
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

      if (e.key === '[') {
        e.preventDefault();
        handleShortcutAction('go-back');
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        handleShortcutAction('go-forward');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

