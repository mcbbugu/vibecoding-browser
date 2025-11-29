import React, { useState } from 'react';
import { RefreshCw, Pin, Compass, Circle } from 'lucide-react';
import { ContextMenu } from './ContextMenu';
import { electronAPI } from '../utils/electron';
import { useIframePreview } from '../hooks/useIframePreview';

const getHostname = (url = '') => {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || '未设置';
  }
};

const PreviewCard = React.memo(({ project, onSelectProject, setContextMenu, isDragging, onDragStart, onDragEnd, isPinned }) => {
    const host = getHostname(project.url);
    const gradient = 'from-zinc-400 via-zinc-300/20 to-transparent dark:from-zinc-600 dark:via-zinc-700/30 dark:to-transparent';
    
    const shouldPreview = project.url && project.status === 'running';
    const { containerRef, previewError, isLoading, canPreview } = useIframePreview(project.url, shouldPreview);

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        projectId: project.id
      });
    };

    const handleDragStart = (e) => {
      e.dataTransfer.setData('projectId', project.id);
      e.dataTransfer.setData('isPinned', isPinned ? 'true' : 'false');
      e.dataTransfer.effectAllowed = 'move';
      onDragStart?.(project.id);
    };

    return (
      <div
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onContextMenu={handleContextMenu}
        className={`relative cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectProject(project.id);
          }}
          className="flex flex-col rounded-xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/5 p-3 hover:border-indigo-400/40 hover:shadow-sm transition-all duration-200 text-left w-full group"
        >
        <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}>
          {canPreview && project.url ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">加载中...</span>
                  </div>
                </div>
              )}
              {!previewError && (
                <div
                  ref={containerRef}
                  className="w-full h-full overflow-hidden"
                />
              )}
              {previewError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">预览加载失败</p>
                  </div>
                </div>
              )}
            </>
          ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">{project.status === 'running' ? '预览不可用' : '服务未运行'}</p>
              </div>
              </div>
          )}
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1">{project.name || host}</p>
            <Circle size={6} className={project.status === 'running' ? 'text-emerald-500 fill-emerald-500 shrink-0' : 'text-zinc-400 fill-zinc-400 shrink-0'} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{project.path || project.url}</p>
        </div>
      </button>
      </div>
    );
}, (prevProps, nextProps) => {
  return prevProps.project.id === nextProps.project.id &&
         prevProps.project.url === nextProps.project.url &&
         prevProps.project.status === nextProps.project.status &&
         prevProps.project.pinned === nextProps.project.pinned &&
         prevProps.isDragging === nextProps.isDragging &&
         prevProps.isPinned === nextProps.isPinned;
});

export const Dashboard = ({ projects, onSelectProject, onQuickNavigate, onScanPorts, onOpenEdit, onDeleteProject, onPinProject, showToast }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [isDragOverPinned, setIsDragOverPinned] = useState(false);
  const [isDragOverDiscovered, setIsDragOverDiscovered] = useState(false);

  React.useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-context-menu]')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);
  
  const pinnedProjects = React.useMemo(() => {
    return projects.filter(p => p.pinned).sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running'));
  }, [projects]);
  
  const discoveredProjects = React.useMemo(() => {
    return projects.filter(p => !p.pinned && p.status === 'running');
  }, [projects]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onScanPorts) {
      onScanPorts('common');
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverPinned(true);
  };

  const handleDragLeave = () => {
    setIsDragOverPinned(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    const wasPinned = e.dataTransfer.getData('isPinned') === 'true';
    if (projectId && onPinProject && !wasPinned) {
      onPinProject(projectId, true);
      showToast('已固定项目', 'success');
    }
    setIsDragOverPinned(false);
    setDraggingId(null);
  };

  const handleDiscoveredDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverDiscovered(true);
  };

  const handleDiscoveredDragLeave = () => {
    setIsDragOverDiscovered(false);
  };

  const handleDiscoveredDrop = (e) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    const wasPinned = e.dataTransfer.getData('isPinned') === 'true';
    if (projectId && onPinProject && wasPinned) {
      onPinProject(projectId, false);
      showToast('已取消固定', 'success');
    }
    setIsDragOverDiscovered(false);
    setDraggingId(null);
  };

    return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-50 dark:bg-[#111111] transition-colors duration-300 border-0">
      <div className="flex-1 flex flex-col min-h-0 max-w-6xl mx-auto w-full px-8 pt-12">
        
        <section className="flex flex-col shrink-0 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pin size={14} className="text-zinc-400 dark:text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">固定项目</h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{pinnedProjects.length}</span>
          </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`h-[445px] rounded-xl transition-all duration-200 overflow-y-auto ${
              isDragOverPinned 
                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-2 border-dashed border-indigo-400 dark:border-indigo-500' 
                : pinnedProjects.length === 0 
                  ? 'border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-white/[0.02]'
                  : ''
            }`}
          >
            {pinnedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 p-1">
                {pinnedProjects.map(project => (
                  <PreviewCard 
                    key={project.id} 
                    project={project} 
                    onSelectProject={onSelectProject}
                    setContextMenu={setContextMenu}
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                    isDragging={draggingId === project.id}
                    isPinned={true}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
                {isDragOverPinned ? (
                  <p className="text-sm text-indigo-500">松开以固定项目</p>
                ) : (
                  <>
                    <p className="text-sm">拖拽下方服务到这里固定</p>
                    <p className="text-xs mt-1">固定后即使服务停止也会保留</p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col shrink-0 pt-2 pb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-zinc-400 dark:text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">发现的服务</h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{discoveredProjects.length}</span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              title="扫描端口（右键更多选项）"
              onContextMenu={(e) => {
                e.preventDefault();
                const menu = e.currentTarget.nextElementSibling;
                if (menu) {
                  menu.classList.toggle('hidden');
                }
              }}
            >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
              <div className="hidden absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onScanPorts) onScanPorts('common');
                  e.currentTarget.parentElement.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                快速扫描（常用端口）
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onScanPorts) onScanPorts('development');
                  e.currentTarget.parentElement.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                开发端口扫描（3000-10000）
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onScanPorts) onScanPorts('all');
                  e.currentTarget.parentElement.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                全面扫描（所有常用段）
              </button>
              </div>
            </div>
          </div>
          
          <div 
            onDragOver={handleDiscoveredDragOver}
            onDragLeave={handleDiscoveredDragLeave}
            onDrop={handleDiscoveredDrop}
            className={`h-[445px] overflow-y-auto rounded-xl transition-all duration-200 ${
              isDragOverDiscovered 
                ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-dashed border-rose-400 dark:border-rose-500' 
                : ''
            }`}
          >
            {discoveredProjects.length > 0 || isDragOverDiscovered ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 p-1 min-h-[100px]">
                {discoveredProjects.map(project => (
                  <PreviewCard 
                    key={project.id} 
                    project={project} 
                    onSelectProject={onSelectProject}
                    setContextMenu={setContextMenu}
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                    isDragging={draggingId === project.id}
                    isPinned={false}
                  />
                ))}
                {isDragOverDiscovered && discoveredProjects.length === 0 && (
                  <div className="col-span-full flex items-center justify-center h-[100px] text-rose-500 text-sm">
                    松开以取消固定
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 bg-white/40 dark:bg-white/[0.02]">
                <span>未发现运行中的服务，点击刷新扫描端口</span>
              </div>
            )}
          </div>
      </section>
      </div>

        {contextMenu && (
          <ContextMenu
            position={contextMenu}
            project={projects.find(p => p.id === contextMenu.projectId)}
            onClose={() => setContextMenu(null)}
            onAction={(action, projectId) => {
              setContextMenu(null);
              switch(action) {
                case 'toggle':
                  break;
                case 'open':
                  const targetProject = projects.find(p => p.id === projectId);
                  if (targetProject && targetProject.url) {
                    window.open(targetProject.url, '_blank');
                  }
                  break;
                case 'finder':
                  const finderProject = projects.find(p => p.id === projectId);
                  if (finderProject && finderProject.path) {
                    electronAPI.openFolder(finderProject.path).then(result => {
                      if (!result.success) {
                        showToast(`Failed to open folder: ${result.error}`, 'error');
                      }
                    });
                  } else {
                    showToast('Project path not set', 'error');
                  }
                  break;
                case 'edit':
                  if (onOpenEdit) onOpenEdit(projectId);
                  break;
              case 'pin':
                if (onPinProject) {
                  const project = projects.find(p => p.id === projectId);
                  onPinProject(projectId, !project?.pinned);
                  showToast(project?.pinned ? '已取消固定' : '已固定项目', 'success');
                }
                break;
                case 'delete':
                  if (onDeleteProject) {
                    const deleteProject = projects.find(p => p.id === projectId);
                    if (deleteProject && window.confirm(`确定要删除项目 "${deleteProject.name}" 吗？`)) {
                      onDeleteProject(projectId);
                    }
                  }
                  break;
                default:
                  break;
              }
            }}
          />
        )}
    </div>
  );
};
