import { useCallback } from 'react';
import { electronAPI } from '../utils/electron';
import { storage } from '../utils/storage';

const DEFAULT_EDITOR_CONFIG = { command: 'code', args: ['{path}'] };

export const useEditor = (showToast, setIsEditorConfigOpen) => {
  const openEditor = useCallback(async (project) => {
    const projectPath = typeof project === 'string' ? project : project?.path;
    if (!projectPath) {
      showToast('项目路径未设置', 'error');
      return;
    }

    let editorConfig;
    if (project && typeof project === 'object' && project.editorConfig) {
      editorConfig = project.editorConfig;
    } else {
      if (!storage.has('editorConfig')) {
        setIsEditorConfigOpen(true);
        return;
      }
      editorConfig = storage.get('editorConfig', DEFAULT_EDITOR_CONFIG);
    }
    
    const command = editorConfig.command;
    const args = editorConfig.args.map(arg => arg.replace('{path}', projectPath));
    
    const result = await electronAPI.openEditor(command, args);
    
    if (result.success) {
      showToast('编辑器已打开', 'success');
    } else {
      const errorMsg = result.error || '未知错误';
      if (errorMsg.includes('ENOENT') || errorMsg.includes('找不到命令')) {
        showToast(`找不到命令 "${command}"，请检查编辑器配置`, 'error');
        setTimeout(() => {
          setIsEditorConfigOpen(true);
        }, 2000);
      } else {
        showToast(`打开编辑器失败: ${errorMsg.split('\n')[0]}`, 'error');
      }
    }
  }, [showToast, setIsEditorConfigOpen]);

  return { openEditor };
};

