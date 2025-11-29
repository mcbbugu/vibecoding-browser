import React, { useState, useMemo } from 'react';
import { RefreshCw, Pin, Zap, Circle, MonitorX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContextMenu } from './ContextMenu';
import { electronAPI } from '../utils/electron';
import { useIframePreview } from '../hooks/useIframePreview';

const getHostname = (url = '', fallback = '') => {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || fallback;
  }
};

const CardContent = React.memo(({ project }) => {
  const { t } = useTranslation();
  const host = getHostname(project.url, t('project.noUrl'));
  const gradient = 'from-zinc-400 via-zinc-300/20 to-transparent dark:from-zinc-600 dark:via-zinc-700/30 dark:to-transparent';
  const shouldPreview = project.url && project.status === 'running';
  const { containerRef, previewError, isLoading, canPreview } = useIframePreview(project.url, shouldPreview);

  return (
    <div className="flex flex-col rounded-xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/5 p-3 transition-all duration-200 text-left w-full group hover:shadow-md">
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
}, (prevProps, nextProps) => {
  return prevProps.project.id === nextProps.project.id &&
         prevProps.project.url === nextProps.project.url &&
         prevProps.project.status === nextProps.project.status &&
         prevProps.project.name === nextProps.project.name;
});

const SortableCard = React.memo(({ project, onSelectProject, setContextMenu }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id });

  const style = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto'
  }), [transform, transition, isDragging]);

  const handleContextMenu = React.useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id });
  }, [project.id, setContextMenu]);

  const handleClick = React.useCallback(() => {
    onSelectProject(project.id);
  }, [project.id, onSelectProject]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <CardContent project={project} />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.project.id === nextProps.project.id &&
         prevProps.project.url === nextProps.project.url &&
         prevProps.project.status === nextProps.project.status &&
         prevProps.project.name === nextProps.project.name;
});

const DragOverlayCard = ({ project }) => {
  const { t } = useTranslation();
  if (!project) return null;
  const host = getHostname(project.url, t('project.noUrl'));
  const gradient = 'from-zinc-400 via-zinc-300/20 to-transparent dark:from-zinc-600 dark:via-zinc-700/30 dark:to-transparent';
  
  return (
    <div className="shadow-2xl scale-105 rotate-2 opacity-95 w-[280px] rounded-xl overflow-hidden">
      <div className="flex flex-col rounded-xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/5 p-3">
        <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard.dragging')}</p>
          </div>
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{project.name || host}</p>
            <Circle size={6} className={project.status === 'running' ? 'text-emerald-500 fill-emerald-500 shrink-0' : 'text-zinc-400 fill-zinc-400 shrink-0'} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{project.path || project.url}</p>
        </div>
      </div>
    </div>
  );
};

const DroppableZone = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      id={id}
      className={`${className} ${isOver ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
};

export const Dashboard = ({ projects, onSelectProject, onScanPorts, onOpenEdit, onDeleteProject, onPinProject, onReorderProjects, showToast }) => {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-context-menu]')) setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const pinnedProjects = useMemo(() => 
    projects.filter(p => p.pinned).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), 
    [projects]
  );

  const discoveredProjects = useMemo(() => 
    projects.filter(p => !p.pinned && p.status === 'running').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), 
    [projects]
  );

  const pinnedIds = useMemo(() => pinnedProjects.map(p => p.id), [pinnedProjects]);
  const discoveredIds = useMemo(() => discoveredProjects.map(p => p.id), [discoveredProjects]);

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  const findContainer = (id) => {
    if (pinnedIds.includes(id)) return 'pinned';
    if (discoveredIds.includes(id)) return 'discovered';
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    // 只用于视觉反馈，不改变状态
    // 实际的状态变化在 handleDragEnd 中处理
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = over.id === 'pinned-zone' ? 'pinned'
      : over.id === 'discovered-zone' ? 'discovered'
      : findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer && active.id !== over.id) {
      const items = overContainer === 'pinned' ? pinnedProjects : discoveredProjects;
      const oldIndex = items.findIndex(p => p.id === active.id);
      const newIndex = items.findIndex(p => p.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderProjects?.(active.id, over.id, overContainer);
      }
    } else if (activeContainer !== overContainer) {
      const shouldPin = overContainer === 'pinned';
      onPinProject?.(active.id, shouldPin, over.id !== 'pinned-zone' && over.id !== 'discovered-zone' ? over.id : null);
      showToast(shouldPin ? t('toast.pinned') : t('toast.unpinned'), 'success');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onScanPorts?.('common');
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-50 dark:bg-[#111111] transition-colors duration-300 border-0">
        {/* 顶部拖拽区域 */}
        <div 
          className="h-10 shrink-0 app-drag-region"
          onDoubleClick={() => window.electronAPI?.toggleMaximize?.()}
        />
        <div className="flex-1 flex flex-col min-h-0 max-w-6xl mx-auto w-full px-8">
          
          <section className="flex flex-col shrink-0 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Pin size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('nav.pinned')}</h2>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{pinnedProjects.length}</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            <SortableContext items={pinnedIds} strategy={rectSortingStrategy}>
              <DroppableZone
                id="pinned-zone"
                className={`h-[445px] rounded-xl transition-all duration-200 overflow-y-auto ${
                  pinnedProjects.length === 0 
                    ? 'border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-white/[0.02]' 
                    : ''
                }`}
              >
                {pinnedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 p-1">
                    {pinnedProjects.map(project => (
                      <SortableCard
                        key={project.id}
                        project={project}
                        onSelectProject={onSelectProject}
                        setContextMenu={setContextMenu}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
                    <p className="text-sm">{t('dashboard.emptyPinned')}</p>
                    <p className="text-xs mt-1">{t('dashboard.emptyPinnedHint')}</p>
                  </div>
                )}
              </DroppableZone>
            </SortableContext>
          </section>

          <section className="flex flex-col shrink-0 pt-2 pb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('nav.discover')}</h2>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{discoveredProjects.length}</span>
              </div>
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.currentTarget.nextElementSibling?.classList.toggle('hidden');
                  }}
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
                <div className="hidden absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                  {['common', 'development', 'all'].map((type) => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScanPorts?.(type);
                        e.currentTarget.parentElement?.classList.add('hidden');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      {type === 'common' ? t('dashboard.scanQuick') : type === 'development' ? t('dashboard.scanDev') : t('dashboard.scanAll')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SortableContext items={discoveredIds} strategy={rectSortingStrategy}>
              <DroppableZone
                id="discovered-zone"
                className={`h-[225px] rounded-xl transition-all duration-200 2xl:h-[445px] ${
                  discoveredProjects.length === 0 
                    ? 'border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-white/[0.02]' 
                    : ''
                }`}
              >
                {discoveredProjects.length > 0 ? (
                  <div className="h-full flex gap-3.5 px-1 py-1 overflow-x-auto 2xl:grid 2xl:grid-cols-4 2xl:overflow-y-auto 2xl:overflow-x-visible">
                    {discoveredProjects.map(project => (
                      <div key={project.id} className="w-[260px] shrink-0 2xl:w-auto 2xl:shrink">
                        <SortableCard
                          project={project}
                          onSelectProject={onSelectProject}
                          setContextMenu={setContextMenu}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-400 dark:text-zinc-500">
                    {t('dashboard.emptyDiscover')}
                  </div>
                )}
              </DroppableZone>
            </SortableContext>
          </section>
        </div>

        {contextMenu && (
          <ContextMenu
            position={contextMenu}
            project={projects.find(p => p.id === contextMenu.projectId)}
            onClose={() => setContextMenu(null)}
            onAction={(action, projectId) => {
              setContextMenu(null);
              const project = projects.find(p => p.id === projectId);
              switch (action) {
                case 'open':
                  if (project?.url) window.open(project.url, '_blank');
                  break;
                case 'finder':
                  if (project?.path) {
                    electronAPI.openFolder(project.path).then(r => {
                      if (!r.success) showToast(`Failed to open folder: ${r.error}`, 'error');
                    });
                  } else {
                    showToast('Project path not set', 'error');
                  }
                  break;
                case 'edit':
                  onOpenEdit?.(projectId);
                  break;
                case 'pin':
                  onPinProject?.(projectId, !project?.pinned);
                  showToast(project?.pinned ? t('toast.unpinned') : t('toast.pinned'), 'success');
                  break;
                case 'delete':
                  if (project && window.confirm(t('confirm.deleteProject', { name: project.name }))) {
                    onDeleteProject?.(projectId);
                  }
                  break;
              }
            }}
          />
        )}
      </div>

      <DragOverlay>
        <DragOverlayCard project={activeProject} />
      </DragOverlay>
    </DndContext>
  );
};
