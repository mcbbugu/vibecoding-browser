import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { electronAPI } from '../utils/electron';
import { useEditor } from './useEditor';

export const useShortcuts = () => {
  const { t } = useTranslation();
  const { 
    setIsSearchOpen, 
    setActiveProjectId, 
    activeProjectId,
    projects,
    showToast,
    handleCmdSPress,
    setIsFindBarOpen,
    setIsEditorConfigOpen,
    getMRUProjects,
    setSkipMRUUpdate,
    updateMRU
  } = useApp();
  
  const mruIndexRef = useRef(0);
  const isCtrlHeldRef = useRef(false);
  const mruSnapshotRef = useRef([]);
  

  const { openEditor } = useEditor(showToast, setIsEditorConfigOpen);

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
        if (setIsFindBarOpen) {
          setIsFindBarOpen(true);
        }
        break;
      case 'open-editor': {
        const activeProject = projects?.find(p => p.id === activeProjectId);
        if (activeProject?.path) {
          openEditor(activeProject);
        } else {
          showToast(t('toast.projectPathNotSet'), 'error');
        }
        break;
      }
      case 'toggle-devtools':
        if (electronAPI.isAvailable()) {
          electronAPI.browserViewDevTools();
        }
        break;
      case 'next-tab':
      case 'prev-tab': {
        const mruProjects = getMRUProjects();
        if (mruProjects.length < 2) break;
        
        // 如果 snapshot 为空或无效，重新创建
        if (!isCtrlHeldRef.current || mruSnapshotRef.current.length === 0) {
          isCtrlHeldRef.current = true;
          mruSnapshotRef.current = [...mruProjects];
          mruIndexRef.current = 0;
          setSkipMRUUpdate(true);
        }
        
        const snapshot = mruSnapshotRef.current;
        if (snapshot.length === 0) break;
        
        if (action === 'next-tab') {
          mruIndexRef.current = (mruIndexRef.current + 1) % snapshot.length;
        } else {
          mruIndexRef.current = (mruIndexRef.current - 1 + snapshot.length) % snapshot.length;
        }
        const nextProject = snapshot[mruIndexRef.current];
        if (nextProject) {
          setActiveProjectId(nextProject.id);
        }
        break;
      }
      case 'ctrl-released': {
        if (isCtrlHeldRef.current && activeProjectId) {
          setSkipMRUUpdate(false);
          updateMRU(activeProjectId);
        }
        isCtrlHeldRef.current = false;
        mruIndexRef.current = 0;
        mruSnapshotRef.current = [];
        break;
      }
      default:
        break;
    }
  }, [activeProjectId, projects, setIsSearchOpen, setActiveProjectId, showToast, handleCmdSPress, openEditor, t, getMRUProjects, setSkipMRUUpdate, updateMRU]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isModalOpen = document.querySelector('[class*="z-[9999]"]') !== null;
      
      if (isModalOpen) {
        return;
      }
      
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleShortcutAction('find');
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleShortcutAction('open-editor');
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
        's': 'cmd-s',
        'e': 'open-editor'
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

      // Ctrl+Tab MRU 切换
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const mruProjects = getMRUProjects();
        if (mruProjects.length < 2) return;
        
        if (!isCtrlHeldRef.current) {
          isCtrlHeldRef.current = true;
          mruIndexRef.current = 0;
        }
        
        if (e.shiftKey) {
          mruIndexRef.current = (mruIndexRef.current - 1 + mruProjects.length) % mruProjects.length;
        } else {
          mruIndexRef.current = (mruIndexRef.current + 1) % mruProjects.length;
        }
        
        const nextProject = mruProjects[mruIndexRef.current];
        if (nextProject) {
          setActiveProjectId(nextProject.id);
        }
        return;
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        if (isCtrlHeldRef.current && activeProjectId) {
          setSkipMRUUpdate(false);
          updateMRU(activeProjectId);
        }
        isCtrlHeldRef.current = false;
        mruIndexRef.current = 0;
        mruSnapshotRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleShortcutAction, getMRUProjects, setActiveProjectId, activeProjectId, setSkipMRUUpdate, updateMRU]);

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

