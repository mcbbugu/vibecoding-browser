import React, { useState } from 'react';
import { ArrowUpRight, Circle, Globe, Monitor, RefreshCw } from 'lucide-react';
import { getProjectCategory, PROJECT_CATEGORY_LABELS } from '../constants';
import { ContextMenu } from './ContextMenu';
import { electronAPI } from '../utils/electron';

const CATEGORY_CONFIG = {
  local: {
    icon: Monitor,
    gradient: 'from-emerald-500/60 via-emerald-400/15 to-transparent',
    chip: 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/30'
  },
  online: {
    icon: Globe,
    gradient: 'from-sky-500/60 via-sky-400/15 to-transparent',
    chip: 'text-sky-500 bg-sky-500/10 ring-sky-500/30'
  }
};

const STATUS_STYLES = {
  running: 'bg-emerald-500/15 text-emerald-500',
  starting: 'bg-amber-500/15 text-amber-500',
  error: 'bg-rose-500/15 text-rose-500',
  stopped: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
};

const getHostname = (url = '') => {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || '未设置';
  }
};

const getStatusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.stopped;

export const Dashboard = ({ projects, onSelectProject, onQuickNavigate, onScanPorts, onOpenEdit, onDeleteProject, showToast }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const runningProjects = projects.filter(p => p.status === 'running');
  const groupedProjects = React.useMemo(() => {
    const result = { local: [], online: [] };
    projects.forEach(project => {
      const category = getProjectCategory(project);
      if (category === 'local') {
        result.local.push(project);
      } else {
        result.online.push(project);
      }
    });
    const sorter = (a, b) => Number(b.status === 'running') - Number(a.status === 'running');
    result.local.sort(sorter);
    result.online.sort(sorter);
    return result;
  }, [projects]);

  const PreviewCard = ({ project, category }) => {
    const host = getHostname(project.url);
    const Icon = CATEGORY_CONFIG[category]?.icon || Globe;
    const gradient = CATEGORY_CONFIG[category]?.gradient || CATEGORY_CONFIG.online.gradient;
    const faviconHost = host && host !== '未设置' ? host : '';
    const [previewError, setPreviewError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const isLocal = category === 'local';
    const timeoutRef = React.useRef(null);
    const iframeRef = React.useRef(null);
    const lastUrlRef = React.useRef(null);
    
    const shouldPreview = project.url && ((isLocal && project.status === 'running') || (!isLocal));
    const canPreview = shouldPreview && !previewError;

    React.useEffect(() => {
      if (lastUrlRef.current !== project.url) {
        setPreviewError(false);
        lastUrlRef.current = project.url;
      }

      if (shouldPreview && project.url) {
        setIsLoading(true);
        
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          setPreviewError(true);
        }, 5000);
      } else {
        setIsLoading(false);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [project.url, project.status, shouldPreview]);

    const handleIframeLoad = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsLoading(false);
      setPreviewError(false);
    };

    const handleIframeError = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPreviewError(true);
      setIsLoading(false);
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        projectId: project.id
      });
    };

    const handleContextMenuAction = (action, projectId) => {
      setContextMenu(null);
      switch(action) {
        case 'toggle':
          break;
        case 'open':
          if (project.url) {
            window.open(project.url, '_blank');
          }
          break;
        case 'finder':
          const targetProject = projects.find(p => p.id === projectId);
          if (targetProject && targetProject.path) {
            electronAPI.openFolder(targetProject.path).then(result => {
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
        case 'delete':
          if (onDeleteProject) {
            const targetProject = projects.find(p => p.id === projectId);
            if (targetProject && window.confirm(`确定要删除项目 "${targetProject.name}" 吗？`)) {
              onDeleteProject(projectId);
            }
          }
          break;
        default:
          break;
      }
    };

    return (
      <div
        onContextMenu={handleContextMenu}
        className="relative"
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectProject(project.id);
          }}
          className="flex flex-col rounded-2xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/5 p-4 hover:border-indigo-400/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-left w-full"
        >
        <div className={`relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br ${gradient}`}>
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
                <iframe
                  ref={iframeRef}
                  src={project.url}
                  className="w-full h-full"
                  style={{ 
                    border: 'none', 
                    pointerEvents: 'none',
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                    width: '200%',
                    height: '200%'
                  }}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-same-origin allow-scripts"
                  loading="lazy"
                />
              )}
              {previewError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                  <div className="text-center">
                    <Icon size={32} className="text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">预览加载失败</p>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md text-white/90 z-20">
                <Icon size={14} />
                {PROJECT_CATEGORY_LABELS[category]}
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent)]" />
              <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[linear-gradient(120deg,rgba(255,255,255,0.6),transparent)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Icon size={32} className="text-white/40 mx-auto mb-2" />
                  <p className="text-xs text-white/60">{project.status === 'running' ? '预览不可用' : '服务未运行'}</p>
                </div>
              </div>
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-white/80">
                <Icon size={14} />
                {PROJECT_CATEGORY_LABELS[category]}
              </div>
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs font-mono text-white/80">
                <span className="truncate">{host}</span>
                <ArrowUpRight size={14} />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{project.name || host}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{project.path || project.url}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getStatusStyle(project.status)}`}>
            {project.status || 'stopped'}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            {faviconHost ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${faviconHost}&sz=32`}
                alt=""
                className="w-5 h-5 rounded-md bg-white/20"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800" />
            )}
            <span className="truncate">{faviconHost || '未配置域名'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <Circle size={6} className={project.status === 'running' ? 'text-emerald-500 fill-emerald-500/40' : 'text-zinc-400'} />
            {project.status === 'running' ? 'Live' : 'Idle'}
          </div>
        </div>
      </button>
      {contextMenu && contextMenu.projectId === project.id && (
        <ContextMenu
          position={contextMenu}
          project={project}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}
      </div>
    );
  };

  const renderSection = (category) => {
    const projectsInCategory = groupedProjects[category];
    const sectionMeta = CATEGORY_CONFIG[category];
    const Icon = sectionMeta?.icon || Globe;
    return (
      <section key={category} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 ${sectionMeta?.chip}`}>
                <Icon size={16} />
              </span>
              {PROJECT_CATEGORY_LABELS[category]}
            </div>
            {onScanPorts && category === 'local' && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onScanPorts();
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                title="扫描端口"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-500">最近的 {projectsInCategory.length} 个站点</p>
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">Total {projectsInCategory.length}</span>
        </div>
        {projectsInCategory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsInCategory.map(project => (
              <PreviewCard key={project.id} project={project} category={category} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-white/5">
            <span>暂无站点，输入域名即可保存</span>
            <ArrowUpRight size={16} className="text-zinc-400" />
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-zinc-50 dark:bg-[#111111] transition-colors duration-300 border-0">
      <div className="max-w-5xl mx-auto space-y-10 flex-1">
        <div className="max-w-2xl mx-auto w-full">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const input = e.target.elements.url;
                  if (input.value.trim() && onQuickNavigate) {
                    onQuickNavigate(input.value.trim());
                    input.value = '';
                  }
                  return false;
                }}
                className="relative"
              >
                <input
                  name="url"
                  type="text"
              placeholder="输入域名或搜索，即刻保存到列表"
                data-address-bar="true"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  autoFocus
                />
              </form>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">⌘T</kbd> 新建
                </span>
                <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">⌘L</kbd> 地址栏
                </span>
                <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">⌘K</kbd> 搜索
                </span>
              </div>
            </div>

        {['local', 'online'].map(renderSection)}
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

