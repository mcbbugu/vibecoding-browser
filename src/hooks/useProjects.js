import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { normalizeProjectUpdates, detectProjectType, getProjectCommand } from '../utils/project';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';
import { getProjectCategory } from '../constants';

export const useProjects = () => {
  const { projects, setProjects, showToast, activeSpaceId } = useApp();

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
    const oldBoundProjectId = projects.find(p => p.id === id)?.boundProjectId;
    const newBoundProjectId = normalizedUpdates.boundProjectId || null;

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
        if (oldBoundProjectId && p.id === oldBoundProjectId && p.boundProjectId === id) {
          return { ...p, boundProjectId: null };
        }
        if (newBoundProjectId && p.id === newBoundProjectId) {
          return { ...p, boundProjectId: id };
        }
        return p;
      });
      return updated;
    });

    showToast('Project updated', 'success');
  }, [setProjects, showToast, projects]);

  const handleDeleteProject = useCallback((id) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.boundProjectId === id) {
          return { ...p, boundProjectId: null };
        }
        return p;
      });
      return updated.filter(p => p.id !== id);
    });
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
      setProjects(prev => prev.map(p => {
        if (p.id === id) {
          const toggled = p.status === 'running' ? 'stopped' : 'running';
          return { ...p, status: toggled };
        }
        return p;
      }));
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

  const handleScanPorts = useCallback(async () => {
    if (!electronAPI.isAvailable()) return;
    
    try {
      showToast('正在扫描端口...', 'info');
      const openPorts = await electronAPI.scanCommonPorts();
      
      setProjects(prev => {
        const updatedProjects = [...prev];
        
        openPorts.forEach(openPort => {
          const port = openPort.port || openPort;
          const existingProject = updatedProjects.find(p => p.port === port);
          
          if (existingProject) {
            const index = updatedProjects.indexOf(existingProject);
            if (existingProject.status !== 'running') {
              updatedProjects[index] = { ...existingProject, status: 'running' };
            }
          } else {
            const newProject = {
              id: `port-${port}-${Date.now()}`,
              name: `Service on Port ${port}`,
              url: `http://localhost:${port}`,
              port: port,
              status: 'running',
              space: activeSpaceId,
              path: '',
              type: detectProjectType(port),
              note: '',
              category: 'local'
            };
            updatedProjects.push(newProject);
            showToast(`发现端口 ${port} 上的服务`, 'success');
          }
        });
        
        updatedProjects.forEach((project, index) => {
          const portStillOpen = openPorts.some(op => {
            const port = op.port || op;
            return port === project.port;
          });
          if (!portStillOpen && project.status === 'running' && project.port) {
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
  }, [setProjects, showToast, activeSpaceId]);

  const handleQuickNavigate = useCallback((input) => {
    let targetUrl = input.trim();
    
    if (isSearchQuery(targetUrl)) {
      targetUrl = createSearchUrl(targetUrl);
    } else {
      targetUrl = normalizeUrl(targetUrl);
    }
    
    const newProject = {
      id: `quick-${Date.now()}`,
      name: targetUrl.includes('google.com/search') ? 'Search: ' + input : input,
      url: targetUrl,
      status: 'running',
      space: activeSpaceId,
      type: 'web',
      port: null,
      category: 'online'
    };
    
    setProjects(prev => [...prev, newProject]);
    showToast('Opening: ' + targetUrl, 'success');
    return newProject;
  }, [setProjects, showToast, activeSpaceId]);

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

