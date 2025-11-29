import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { electronAPI } from '../utils/electron';
import { storage } from '../utils/storage';

const PRESET_EDITORS = {
  code: { command: 'code' },
  cursor: { command: 'cursor' },
  windsurf: { command: 'windsurf' },
};

export const useEditor = (showToast, setIsEditorConfigOpen) => {
  const { t } = useTranslation();
  
  const openEditor = useCallback(async (project) => {
    const projectPath = typeof project === 'string' ? project : project?.path;
    if (!projectPath) {
      showToast(t('toast.projectPathNotSet'), 'error');
      return;
    }

    const selectedEditor = storage.get('selectedEditor', 'cursor');
    const customEditors = storage.get('customEditors', []);
    
    let command;
    if (PRESET_EDITORS[selectedEditor]) {
      command = PRESET_EDITORS[selectedEditor].command;
    } else {
      const customEditor = customEditors.find(e => e.id === selectedEditor);
      if (customEditor && customEditor.command) {
        command = customEditor.command;
      } else {
        command = 'cursor';
      }
    }
    
    const result = await electronAPI.openEditor(command, [projectPath]);
    
    if (result.success) {
      showToast(t('toast.editorOpened'), 'success');
    } else {
      const errorMsg = result.error || t('toast.unknownError');
      if (errorMsg.includes('ENOENT') || errorMsg.includes('command not found') || errorMsg.toLowerCase().includes('not found')) {
        showToast(t('toast.commandNotFound', { command }), 'error');
        setTimeout(() => {
          setIsEditorConfigOpen(true);
        }, 2000);
      } else {
        showToast(t('toast.editorOpenFailed', { error: errorMsg.split('\n')[0] }), 'error');
      }
    }
  }, [showToast, setIsEditorConfigOpen, t]);

  return { openEditor };
};

