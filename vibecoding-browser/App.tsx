import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BrowserView } from './components/BrowserView';
import { SearchModal } from './components/SearchModal';
import { Toast } from './components/Toast';
import { SPACES, MOCK_PROJECTS } from './constants';
import { Project, ToastMessage } from './types';

function App() {
  const [spaces] = useState(SPACES);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  
  const [activeSpaceId, setActiveSpaceId] = useState(SPACES[0].id);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ id: Date.now().toString(), message, type });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    // If clearing project (id is empty string), don't change spaces
    if (!id) {
        setActiveProjectId(null);
        return;
    }
    
    const project = projects.find(p => p.id === id);
    if (project && project.space !== activeSpaceId) {
      setActiveSpaceId(project.space);
    }
  };

  const handleToggleProjectStatus = (id: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id === id) {
            const newStatus = p.status === 'running' ? 'stopped' : 'running';
            showToast(`${p.name} ${newStatus === 'running' ? 'started' : 'stopped'}`, newStatus === 'running' ? 'success' : 'info');
            return { ...p, status: newStatus };
        }
        return p;
    }));
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="flex w-full h-full bg-zinc-50 dark:bg-[#111111] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <Sidebar 
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        setActiveSpaceId={setActiveSpaceId}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onToggleProjectStatus={handleToggleProjectStatus}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        showToast={showToast}
      />
      
      <BrowserView 
        project={activeProject} 
        onStatusChange={handleToggleProjectStatus}
        projects={projects}
        onSelectProject={handleSelectProject}
        showToast={showToast}
      />

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; left: 0; }
          50% { width: 70%; left: 10%; }
          100% { width: 100%; left: 100%; opacity: 0; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}

export default App;