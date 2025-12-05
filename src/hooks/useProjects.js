import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { normalizeProjectUpdates, detectProjectType, getProjectCommand } from '../utils/project';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';
import { getProjectCategory } from '../constants';

export const useProjects = () => {
  const { t } = useTranslation();
  const { projects, setProjects, showToast } = useApp();

  const handleAddProject = useCallback((projectData) => {
    const newProject = {
      id: Date.now().toString(),
      ...projectData,
      category: getProjectCategory(projectData),
      order: Date.now()
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, [setProjects]);

  const handleUpdateProject = useCallback((id, updates) => {
    const normalizedUpdates = normalizeProjectUpdates(updates);

    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const merged = { ...p, ...normalizedUpdates };
          merged.category = getProjectCategory(merged);
          if (!merged.path && normalizedUpdates.url) {
            merged.status = 'running';
          }
          return merged;
        }
        return p;
      });
      return updated;
    });

    showToast('Project updated', 'success');
  }, [setProjects, showToast]);

  const handleDeleteProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast('Project removed', 'info');
  }, [setProjects, showToast]);

  const handleToggleProjectStatus = useCallback(async (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (!electronAPI.isAvailable()) {
      setProjects(prev => prev.map(p => {
        if (p.id === id) {
          const newStatus = p.status === 'running' ? 'stopped' : 'running';
          showToast(`${p.name} ${newStatus === 'running' ? 'started' : 'stopped'}`, newStatus === 'running' ? 'success' : 'info');
          return { ...p, status: newStatus };
        }
        return p;
      }));
      return;
    }

    if (!project.path) {
      if (project.status === 'running') {
        setProjects(prev => prev.map(p => {
          if (p.id === id) {
            return { ...p, status: 'stopped' };
          }
          return p;
        }));
        showToast(`${project.name} stopped`, 'info');
      } else {
        showToast(t('toast.projectPathRequired'), 'error');
      }
      return;
    }

    if (project.status === 'running') {
      try {
        const runningServices = await electronAPI.getRunningServices();
        const service = runningServices.find(s => s.projectPath === project.path);
        if (service) {
          const result = await electronAPI.stopService(service.pid);
          if (result.success) {
            setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'stopped' } : p));
            showToast(`${project.name} stopped`, 'info');
          } else {
            showToast(`Failed to stop: ${result.error}`, 'error');
          }
        } else {
          setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'stopped' } : p));
          showToast(`${project.name} stopped`, 'info');
        }
      } catch (error) {
        showToast(`Error stopping service: ${error.message}`, 'error');
      }
    } else {
      if (!project.path) {
        showToast('Project path not set', 'error');
        return;
      }
      
      try {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'starting' } : p));
        const command = getProjectCommand(project.type);
        
        const result = await electronAPI.startService(project.path, command);
        if (result.success) {
          setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'running', pid: result.pid } : p));
          showToast(`${project.name} started`, 'success');
        } else {
          setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
          showToast(`Failed to start: ${result.error}`, 'error');
        }
      } catch (error) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
        showToast(`Error starting service: ${error.message}`, 'error');
      }
    }
  }, [projects, setProjects, showToast]);

  const handleScanPorts = useCallback(async (scanType = 'common') => {
    if (!electronAPI.isAvailable()) return;
    
    try {
      let scanPromise;
      let progressCleanup;
      
      if (scanType === 'all') {
        showToast(t('toast.scanningAllPorts'), 'info');
        
        progressCleanup = electronAPI.onPortScanProgress?.((progress) => {
          showToast(t('toast.scanningRange', { range: progress.range, scanning: progress.scanning }), 'info');
        });
        
        scanPromise = electronAPI.scanAllPorts();
      } else if (scanType === 'development') {
        showToast(t('toast.scanningDevPorts'), 'info');
        
        progressCleanup = electronAPI.onPortScanProgress?.((progress) => {
          showToast(t('toast.scanningRangeSimple', { range: progress.range }), 'info');
        });
        
        scanPromise = electronAPI.scanDevelopmentPorts();
      } else {
        showToast(t('toast.scanningCommonPorts'), 'info');
        scanPromise = electronAPI.scanCommonPorts();
      }
      
      const openPorts = await scanPromise;
      console.log('[ScanPorts] Found open ports:', openPorts);
      
      if (progressCleanup) {
        progressCleanup();
      }
      
      setProjects(prev => {
        console.log('[ScanPorts] Current projects:', prev.map(p => ({ id: p.id, port: p.port, status: p.status, pinned: p.pinned })));
        const updatedProjects = [...prev];
        const foundPorts = new Set();
        
        openPorts.forEach(openPort => {
          const port = Number(openPort.port || openPort);
          if (isNaN(port)) return;
          
          foundPorts.add(port);
          
          const existingProject = updatedProjects.find(p => {
            let projectPort = null;
            
            if (p.port) {
              projectPort = Number(p.port);
            } else if (p.url) {
              try {
                const url = new URL(p.url);
                projectPort = url.port ? Number(url.port) : null;
                if (!projectPort) {
                  const match = p.url.match(/:(\d+)/);
                  if (match) {
                    projectPort = Number(match[1]);
                  }
                }
              } catch {
                const match = p.url.match(/:(\d+)/);
                if (match) {
                  projectPort = Number(match[1]);
                }
              }
            }
            
            return !isNaN(projectPort) && projectPort === port;
          });
          
          if (existingProject) {
            const index = updatedProjects.indexOf(existingProject);
            if (existingProject.status !== 'running') {
              updatedProjects[index] = { ...existingProject, status: 'running' };
            }
            if (!existingProject.port) {
              updatedProjects[index] = { ...updatedProjects[index], port: port };
            }
          } else {
            const newProject = {
              id: `port-${port}-${Date.now()}`,
              name: `Service on Port ${port}`,
              url: `http://localhost:${port}`,
              port: port,
              status: 'running',
              path: '',
              type: detectProjectType(port),
              note: '',
              category: 'local',
              order: Date.now()
            };
            updatedProjects.push(newProject);
          }
        });
        
        // 处理未发现的端口：固定项目标记为停止，临时项目直接删除
        const finalProjects = [];
        for (const project of updatedProjects) {
          const projectPort = Number(project.port);
          const wasRunning = project.status === 'running';
          const portNotFound = !isNaN(projectPort) && !foundPorts.has(projectPort);
          
          console.log('[ScanPorts] Processing:', { id: project.id, port: projectPort, wasRunning, portNotFound, pinned: project.pinned });
          
          if (wasRunning && portNotFound) {
            if (project.pinned) {
              console.log('[ScanPorts] Marking pinned project as stopped:', project.id);
              finalProjects.push({ ...project, status: 'stopped' });
            } else {
              console.log('[ScanPorts] Removing unpinned project:', project.id);
            }
          } else {
            finalProjects.push(project);
          }
        }
        
        console.log('[ScanPorts] Final projects:', finalProjects.map(p => ({ id: p.id, status: p.status })));
        return finalProjects;
      });
      showToast(t('toast.portScanCompleted'), 'success');
    } catch (error) {
      console.error('Port scan failed:', error);
      showToast(t('toast.portScanFailed'), 'error');
    }
  }, [setProjects, showToast, t]);

  const handleQuickNavigate = useCallback((input) => {
    let targetUrl = input.trim();
    
    if (isSearchQuery(targetUrl)) {
      targetUrl = createSearchUrl(targetUrl);
    } else {
      targetUrl = normalizeUrl(targetUrl);
    }
    
    const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

    const isLocalHostname = (host = '') => {
      if (!host) return false;
      return LOCAL_HOSTS.has(host.toLowerCase());
    };

    const getUrlMeta = (value = '') => {
      const meta = { hostname: '', port: null };
      if (!value) return meta;

      const normalize = (input) => {
        if (!input) return '';
        return /^https?:\/\//i.test(input) ? input : `http://${input}`;
      };

      try {
        const parsed = new URL(normalize(value));
        meta.hostname = parsed.hostname.toLowerCase();
        meta.port = parsed.port ? Number(parsed.port) : null;
      } catch {
        const hostMatch = value.match(/^([a-z0-9\.\-:_]+)/i);
        if (hostMatch) {
          meta.hostname = hostMatch[1]
            .replace(/:\d+.*/, '')
            .replace(/\/.*/, '')
            .toLowerCase();
        }
        const portMatch = value.match(/:(\d+)/);
        if (portMatch) {
          meta.port = Number(portMatch[1]);
        }
      }

      if (!meta.port && meta.hostname && isLocalHostname(meta.hostname)) {
        meta.port = null;
      }

      return meta;
    };

    const targetMeta = getUrlMeta(targetUrl);
    const targetPort = targetMeta.port;
    const targetIsLocal = isLocalHostname(targetMeta.hostname);
    
    let resolvedProject = null;
    
    setProjects(prev => {
      const existingProject = prev.find(p => {
        if (p.url === targetUrl) {
          return true;
        }
        
        if (!targetPort) {
          return false;
        }
        
        const projectPort = (() => {
          if (p.port) {
            const parsed = Number(p.port);
            if (!isNaN(parsed)) return parsed;
          }
          const meta = getUrlMeta(p.url || '');
          return meta.port;
        })();
        
        if (!projectPort || projectPort !== targetPort) {
          return false;
        }
        
        const projectMeta = getUrlMeta(p.url || '');
        const projectIsLocal = p.category === 'local' || Boolean(p.path) || isLocalHostname(projectMeta.hostname);
        
        return projectIsLocal || targetIsLocal;
      });
      
      if (existingProject) {
        showToast(t('toast.projectExists'), 'info');
        resolvedProject = existingProject;
        return prev;
      }
      
      resolvedProject = {
        id: `quick-${Date.now()}`,
        name: targetUrl.includes('google.com/search') ? 'Search: ' + input : input,
        url: targetUrl,
        status: 'running',
        type: 'web',
        port: targetPort,
        category: targetIsLocal ? 'local' : 'online',
        order: Date.now()
      };
      
      showToast('Opening: ' + targetUrl, 'success');
      return [...prev, resolvedProject];
    });
    
    return resolvedProject;
  }, [setProjects, showToast]);

  const handlePinProject = useCallback((id, pinned, insertBeforeId = null) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          return { ...p, pinned };
        }
        return p;
      });

      const targetZone = pinned ? 'pinned' : 'discovered';
      const zoneProjects = updated.filter(p => 
        targetZone === 'pinned' ? p.pinned : (!p.pinned && p.status === 'running')
      ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (!insertBeforeId) {
        const maxOrder = Math.max(0, ...zoneProjects.map(p => p.order ?? 0));
        return updated.map(p => 
          p.id === id ? { ...p, order: maxOrder + 1 } : p
        );
      }
      
      const draggedProject = updated.find(p => p.id === id);
      const targetIndex = zoneProjects.findIndex(p => p.id === insertBeforeId);
      
      if (draggedProject && targetIndex !== -1) {
        const filteredZone = zoneProjects.filter(p => p.id !== id);
        filteredZone.splice(targetIndex, 0, draggedProject);
        
        const orderMap = new Map();
        filteredZone.forEach((p, idx) => {
          orderMap.set(p.id, idx);
        });
        
        return updated.map(p => {
          if (orderMap.has(p.id)) {
            return { ...p, order: orderMap.get(p.id) };
          }
          return p;
        });
      }

      return updated;
    });
  }, [setProjects]);

  const handleReorderProjects = useCallback((draggedId, targetId, zone) => {
    setProjects(prev => {
      const zoneProjects = prev.filter(p => 
        zone === 'pinned' ? p.pinned : (!p.pinned && p.status === 'running')
      ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      const draggedIndex = zoneProjects.findIndex(p => p.id === draggedId);
      const targetIndex = zoneProjects.findIndex(p => p.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        return prev;
      }

      const newZoneProjects = [...zoneProjects];
      const [removed] = newZoneProjects.splice(draggedIndex, 1);
      newZoneProjects.splice(targetIndex, 0, removed);
      
      const orderMap = new Map();
      newZoneProjects.forEach((p, idx) => {
        orderMap.set(p.id, idx);
      });
      
      return prev.map(p => {
        if (orderMap.has(p.id)) {
          return { ...p, order: orderMap.get(p.id) };
        }
        return p;
      });
    });
  }, [setProjects]);

  return {
    projects,
    handleAddProject,
    handleUpdateProject,
    handleDeleteProject,
    handleToggleProjectStatus,
    handleScanPorts,
    handleQuickNavigate,
    handlePinProject,
    handleReorderProjects
  };
};

