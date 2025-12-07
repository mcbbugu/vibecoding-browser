import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Circle, MonitorX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { Z_INDEX } from '../utils/constants';
import { useIframePreview } from '../hooks/useIframePreview';

const getHostname = (url = '', fallback = '') => {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || fallback;
  }
};

const ProjectCard = React.memo(({ project, isHighlighted }) => {
  const { t } = useTranslation();
  const host = getHostname(project.url, t('project.noUrl'));
  const gradient = 'from-zinc-400 via-zinc-300/20 to-transparent dark:from-zinc-600 dark:via-zinc-700/30 dark:to-transparent';
  const shouldPreview = project.url && project.status === 'running';
  const { containerRef, previewError, isLoading, canPreview } = useIframePreview(project.url, shouldPreview, 0);

  return (
    <div
      className={`
        flex flex-col rounded-xl bg-white dark:bg-[#0c0c0e] border p-3 transition-all duration-200 text-left w-[280px] shrink-0
        ${isHighlighted 
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105 ring-2 ring-indigo-500/50' 
          : 'border-zinc-200 dark:border-white/5 opacity-60'
        }
      `}
    >
      <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${gradient} pointer-events-none`}>
        {canPreview && project.url ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard.previewLoading')}</span>
                </div>
              </div>
            )}
            {!previewError && (
              <div ref={containerRef} className="w-full h-full overflow-hidden" />
            )}
            {previewError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard.previewError')}</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <MonitorX size={32} className="text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {project.status === 'running' ? t('dashboard.previewUnavailable') : t('dashboard.serviceNotRunning')}
            </p>
          </div>
        )}
      </div>
      <div className="mt-3 min-w-0 pointer-events-none">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{project.name || host}</p>
          <Circle size={6} className={project.status === 'running' ? 'text-emerald-500 fill-emerald-500 shrink-0' : 'text-zinc-400 fill-zinc-400 shrink-0'} />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{project.path || project.url}</p>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export const TabSwitcher = () => {
  // 暂时禁用此功能
  return null;
  
  const { getMRUProjects, activeProjectId, setActiveProjectId, isTabSwitcherOpen, setIsTabSwitcherOpen } = useApp();
  const [highlightIndex, setHighlightIndex] = useState(1);
  const [displayProjects, setDisplayProjects] = useState([]);
  const ctrlKeyDownRef = useRef(false);

  const mruProjects = getMRUProjects();
  const isVisible = isTabSwitcherOpen;
  const setIsVisible = setIsTabSwitcherOpen;

  useEffect(() => {
    if (isVisible && mruProjects.length > 0) {
      const currentIndex = mruProjects.findIndex(p => p.id === activeProjectId);
      let reorderedProjects;
      
      if (currentIndex !== -1) {
        reorderedProjects = [
          mruProjects[currentIndex],
          ...mruProjects.slice(0, currentIndex),
          ...mruProjects.slice(currentIndex + 1)
        ].slice(0, 4);
      } else {
        reorderedProjects = mruProjects.slice(0, 4);
      }
      
      setDisplayProjects(reorderedProjects);
      setHighlightIndex(1);
    }
  }, [isVisible, mruProjects, activeProjectId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        
        const freshMRU = getMRUProjects();
        ctrlKeyDownRef.current = true;
        
        if (!isVisible && freshMRU.length > 0) {
          setIsVisible(true);
        } else if (isVisible && displayProjects.length > 0) {
          setHighlightIndex(prev => (prev + 1) % displayProjects.length);
        }
      } else if (e.ctrlKey) {
        ctrlKeyDownRef.current = true;
      }
    };

    const handleKeyUp = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
        setHighlightIndex(1);
        setDisplayProjects([]);
        return;
      }
      
      if (!isCmdOrCtrl) {
        ctrlKeyDownRef.current = false;
        
        if (isVisible && displayProjects.length > 0) {
          const targetProject = displayProjects[highlightIndex];
          if (targetProject) {
            setActiveProjectId(targetProject.id);
          }
          setIsVisible(false);
          setHighlightIndex(1);
          setDisplayProjects([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [isVisible, highlightIndex, displayProjects, setActiveProjectId, setIsVisible]);

  if (!isVisible || displayProjects.length === 0) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      style={{ 
        zIndex: Z_INDEX.MODAL_BACKDROP,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsVisible(false);
          setHighlightIndex(1);
          setDisplayProjects([]);
        }
      }}
    >
      <div 
        className="relative flex flex-col items-center gap-4"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4 max-w-[90vw] overflow-x-auto px-4 py-8">
          {displayProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              isHighlighted={index === highlightIndex}
            />
          ))}
        </div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
          {highlightIndex + 1} / {displayProjects.length}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

