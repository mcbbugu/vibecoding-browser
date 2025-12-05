import React, { useState, useMemo } from 'react';
import { RefreshCw, Pin, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableProjectItem = ({ project, isActive, isCollapsed, onContextMenu, onSelectProject }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => onContextMenu(e, project.id)}
      onClick={() => onSelectProject(project.id)}
      title={isCollapsed ? project.name : ''}
      className={`
        group flex items-center rounded-xl cursor-grab active:cursor-grabbing relative border touch-none transition-colors
        ${isActive 
          ? 'bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-white shadow-sm border-zinc-200 dark:border-white/5' 
          : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200'}
        ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}
      `}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {!isCollapsed && (
          <>
            <div className={`
              w-2 h-2 rounded-full transition-all duration-300 shadow-sm shrink-0
              ${project.status === 'running' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-300 dark:bg-zinc-600'}
              ${project.status === 'error' ? 'bg-rose-500 shadow-rose-500/50' : ''}
            `} />
            <div className="flex-1 min-w-0 flex flex-col">
              <span className="text-sm font-medium truncate">{project.name}</span>
              {project.url && (() => {
                try {
                  const url = new URL(project.url);
                  const host = url.hostname;
                  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
                  return (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                      {host}:{port}
                    </span>
                  );
                } catch {
                  const displayUrl = project.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                  return (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                      {displayUrl}
                    </span>
                  );
                }
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ProjectList = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onContextMenu,
  isCollapsed,
  onRefresh,
  onReorderProjects,
  onPinProject
}) => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const pinnedProjects = useMemo(() => {
    return projects
      .filter(p => p.pinned)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [projects]);

  const discoveredProjects = useMemo(() => {
    return projects
      .filter(p => !p.pinned && p.status === 'running')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [projects]);

  const pinnedIds = useMemo(() => pinnedProjects.map(p => p.id), [pinnedProjects]);
  const discoveredIds = useMemo(() => discoveredProjects.map(p => p.id), [discoveredProjects]);

  const findContainer = (id) => {
    if (pinnedIds.includes(id)) return 'pinned';
    if (discoveredIds.includes(id)) return 'discovered';
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const shouldPin = overContainer === 'pinned';
    onPinProject?.(active.id, shouldPin);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer && active.id !== over.id) {
      onReorderProjects?.(active.id, over.id, overContainer);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 scrollbar-hide">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Pin size={10} className="text-zinc-400 dark:text-zinc-600" />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">{t('nav.pinned')}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{pinnedProjects.length}</span>
            </div>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
                title={t('action.refresh')}
              >
                <RefreshCw size={12} className={`text-zinc-400 dark:text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <SortableContext items={pinnedIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {pinnedProjects.length === 0 ? (
                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center py-3">
                  {t('dashboard.emptyPinned')}
                </div>
              ) : (
                pinnedProjects.map(project => (
                  <SortableProjectItem
                    key={project.id}
                    project={project}
                    isActive={activeProjectId === project.id}
                    isCollapsed={isCollapsed}
                    onContextMenu={onContextMenu}
                    onSelectProject={onSelectProject}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap size={10} className="text-zinc-400 dark:text-zinc-600" />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">{t('nav.discover')}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{discoveredProjects.length}</span>
            </div>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
                title={t('action.refresh')}
              >
                <RefreshCw size={12} className={`text-zinc-400 dark:text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <SortableContext items={discoveredIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {discoveredProjects.length === 0 ? (
                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center py-3">
                  {t('dashboard.emptyDiscover')}
                </div>
              ) : (
                discoveredProjects.map(project => (
                  <SortableProjectItem
                    key={project.id}
                    project={project}
                    isActive={activeProjectId === project.id}
                    isCollapsed={isCollapsed}
                    onContextMenu={onContextMenu}
                    onSelectProject={onSelectProject}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
};
