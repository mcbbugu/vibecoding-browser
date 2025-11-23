import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { electronAPI } from '../utils/electron';
import { SPACES } from '../constants';
import { CMD_S_DOUBLE_INTERVAL } from '../utils/constants';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const initialSpaces = storage.get('spaces', SPACES);
  const spacesToUse = initialSpaces.length > 0 ? initialSpaces : [];
  
  const [spaces, setSpaces] = useState(spacesToUse);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSpaceId, setActiveSpaceId] = useState(() => {
    return storage.get('activeSpaceId') || (spacesToUse.length > 0 ? spacesToUse[0].id : null);
  });
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUrlInputModalOpen, setIsUrlInputModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return storage.get('theme') === 'dark' || 
        (!storage.get('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarContentHidden, setIsSidebarContentHidden] = useState(false);
  const [isEditorConfigOpen, setIsEditorConfigOpen] = useState(false);
  const lastCmdSPressRef = React.useRef(0);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      storage.set('theme', 'dark');
    } else {
      root.classList.remove('dark');
      storage.set('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const savedProjects = await electronAPI.getProjects();
        setProjects(savedProjects || []);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (electronAPI.isAvailable() && projects.length > 0 && !isLoading) {
      electronAPI.saveProjects(projects);
    }
  }, [projects, isLoading]);

  useEffect(() => {
    storage.set('spaces', spaces);
  }, [spaces]);

  useEffect(() => {
    storage.set('activeSpaceId', activeSpaceId);
  }, [activeSpaceId]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now().toString(), message, type });
  }, []);

  const handleCmdSPress = useCallback(() => {
    const now = Date.now();
    if (now - lastCmdSPressRef.current <= CMD_S_DOUBLE_INTERVAL) {
      setIsSidebarCollapsed(prev => {
        const newValue = !prev;
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('sidebar-toggle'));
        }, 300);
        return newValue;
      });
      lastCmdSPressRef.current = 0;
    } else {
      lastCmdSPressRef.current = now;
    }
  }, [setIsSidebarCollapsed]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const value = {
    spaces,
    setSpaces,
    projects,
    setProjects,
    isLoading,
    activeSpaceId,
    setActiveSpaceId,
    activeProjectId,
    setActiveProjectId,
    isSearchOpen,
    setIsSearchOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isUrlInputModalOpen,
    setIsUrlInputModalOpen,
    editingProjectId,
    setEditingProjectId,
    toast,
    setToast,
    isDarkMode,
    toggleTheme,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isSidebarContentHidden,
    setIsSidebarContentHidden,
    isEditorConfigOpen,
    setIsEditorConfigOpen,
    showToast,
    handleCmdSPress
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

