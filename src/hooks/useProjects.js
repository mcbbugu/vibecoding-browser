import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { normalizeProjectUpdates, detectProjectType, getProjectCommand } from '../utils/project';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';
import { getProjectCategory } from '../constants';

export const useProjects = () => {
  const { projects, setProjects, showToast } = useApp();

  const handleAddProject = useCallback((projectData) => {
    const newProject = {
      id: Date.now().toString(),
      ...projectData,
      category: getProjectCategory(projectData)
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
        showToast('请先设置项目路径才能启动服务', 'error');
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
        showToast('正在扫描所有常用端口...', 'info');
        
        // 监听进度
        progressCleanup = electronAPI.onPortScanProgress?.((progress) => {
          showToast(`扫描 ${progress.range} (${progress.scanning})...`, 'info');
        });
        
        scanPromise = electronAPI.scanAllPorts();
      } else if (scanType === 'development') {
        showToast('正在扫描开发端口...', 'info');
        
        progressCleanup = electronAPI.onPortScanProgress?.((progress) => {
          showToast(`扫描 ${progress.range}...`, 'info');
        });
        
        scanPromise = electronAPI.scanDevelopmentPorts();
      } else {
        showToast('正在扫描常用端口...', 'info');
        scanPromise = electronAPI.scanCommonPorts();
      }
      
      const openPorts = await scanPromise;
      
      if (progressCleanup) {
        progressCleanup();
      }
      
      setProjects(prev => {
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
              category: 'local'
            };
            updatedProjects.push(newProject);
          }
        });
        
        updatedProjects.forEach((project, index) => {
          const projectPort = Number(project.port);
          if (!isNaN(projectPort) && project.status === 'running' && !foundPorts.has(projectPort)) {
            updatedProjects[index] = { ...project, status: 'stopped' };
          }
        });
        
        return updatedProjects;
      });
      showToast('端口扫描完成', 'success');
    } catch (error) {
      console.error('Port scan failed:', error);
      showToast('端口扫描失败', 'error');
    }
  }, [setProjects, showToast]);

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
        showToast('项目已存在', 'info');
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
        category: targetIsLocal ? 'local' : 'online'
      };
      
      showToast('Opening: ' + targetUrl, 'success');
      return [...prev, resolvedProject];
    });
    
    return resolvedProject;
  }, [setProjects, showToast]);

  return {
    projects,
    handleAddProject,
    handleUpdateProject,
    handleDeleteProject,
    handleToggleProjectStatus,
    handleScanPorts,
    handleQuickNavigate
  };
};

