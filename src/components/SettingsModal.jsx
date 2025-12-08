import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Code, Keyboard, Palette, Settings as SettingsIcon, Plus, Trash2, RefreshCw, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { storage } from '../utils/storage';
import { Z_INDEX } from '../utils/constants';
import analytics from '../utils/analytics';

const LANGUAGES = [
  { code: 'zh', name: '简体中文' },
  { code: 'en', name: 'English' },
];

export const SettingsModal = ({ isOpen, onClose, showToast, isDarkMode, toggleTheme }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [selectedEditor, setSelectedEditor] = useState('cursor');
  const [customEditors, setCustomEditors] = useState([]);
  const [language, setLanguage] = useState((i18n.language || 'zh').split('-')[0]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');

  const SHORTCUTS = [
    { key: '⌘T', descKey: 'shortcuts.search' },
    { key: '⌘E', descKey: 'shortcuts.openEditor' },
    { key: '⌘W', descKey: 'shortcuts.closeProject' },
    { key: '⌘R', descKey: 'shortcuts.refresh' },
    { key: '⌘L', descKey: 'shortcuts.focusUrl' },
    { key: '⌘S', descKey: 'shortcuts.toggleSidebar' },
    { key: '⌘F', descKey: 'shortcuts.pageSearch' },
    { key: '⌘[', descKey: 'shortcuts.back' },
    { key: '⌘]', descKey: 'shortcuts.forward' },
  ];

  const presetEditors = [
    { id: 'code', name: 'VS Code', command: 'code' },
    { id: 'cursor', name: 'Cursor', command: 'cursor' },
    { id: 'windsurf', name: 'Windsurf', command: 'windsurf' },
  ];

  useEffect(() => {
    if (isOpen) {
      const savedEditor = storage.get('selectedEditor', 'cursor');
      const savedCustomEditors = storage.get('customEditors', []);
      const savedAnalytics = localStorage.getItem('analytics_consent') === 'true';
      const version = window.electron?.getAppVersion?.() || '1.0.0';
      
      setSelectedEditor(savedEditor);
      setCustomEditors(savedCustomEditors);
      setLanguage((i18n.language || 'zh').split('-')[0]);
      setAnalyticsEnabled(savedAnalytics);
      setAppVersion(version);
      setUpdateInfo(null);
    }
  }, [isOpen, i18n.language]);

  useEffect(() => {
    if (!isOpen) return;

    const cleanupAvailable = window.electronAPI.onUpdateAvailable((info) => {
      showToast(t('toast.updateAvailableToast', { version: info.version }), 'info');
    });

    const cleanupDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateInfo({ downloaded: true, version: info.version });
      showToast(t('settings.updateDownloaded', { version: info.version }), 'success');
    });

    const cleanupError = window.electronAPI.onUpdateError((error) => {
      showToast(t('toast.updateCheckFailed', { error: error.error }), 'error');
      setCheckingUpdate(false);
    });

    return () => {
      cleanupAvailable();
      cleanupDownloaded();
      cleanupError();
    };
  }, [isOpen, showToast, t]);

  if (!isOpen) return null;

  const handleSave = () => {
    storage.set('selectedEditor', selectedEditor);
    storage.set('customEditors', customEditors);
    i18n.changeLanguage(language);
    storage.set('language', language);
    showToast(t('toast.saved'), 'success');
    onClose();
  };

  const handleAddCustomEditor = () => {
    const newEditor = {
      id: `custom-${Date.now()}`,
      name: '',
      command: ''
    };
    setCustomEditors(prev => [...prev, newEditor]);
  };

  const handleRemoveCustomEditor = (id) => {
    setCustomEditors(prev => prev.filter(e => e.id !== id));
    if (selectedEditor === id) {
      setSelectedEditor('cursor');
    }
  };

  const handleCustomEditorChange = (id, field, value) => {
    setCustomEditors(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.success) {
        if (result.updateAvailable) {
          showToast(t('settings.updateAvailable', { version: result.latestVersion }), 'info');
        } else {
          showToast(t('settings.latestVersion'), 'success');
          setCheckingUpdate(false);
        }
      } else {
        showToast(t('settings.updateFailed'), 'error');
        setCheckingUpdate(false);
      }
    } catch (error) {
      showToast(t('settings.updateFailed'), 'error');
      setCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    await window.electronAPI.installUpdate();
  };

  const tabs = [
    { id: 'general', labelKey: 'settings.general', icon: SettingsIcon },
    { id: 'editor', labelKey: 'settings.editor', icon: Code },
    { id: 'shortcuts', labelKey: 'settings.shortcuts', icon: Keyboard },
    { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
  ];

  const RadioOption = ({ selected, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all
        ${selected 
          ? 'bg-zinc-100 dark:bg-white/5' 
          : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
        }
      `}
    >
      <span className={`text-sm ${selected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
        {children}
      </span>
      <div className={`
        w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
        ${selected 
          ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100' 
          : 'border-zinc-300 dark:border-zinc-600'
        }
      `}>
        {selected && <Check size={10} className="text-white dark:text-zinc-900" strokeWidth={3} />}
      </div>
    </button>
  );

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`
        relative w-10 h-6 rounded-full transition-colors
        ${checked ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'}
      `}
    >
      <div className={`
        absolute top-1 w-4 h-4 rounded-full transition-all
        ${checked 
          ? 'left-5 bg-white dark:bg-zinc-900' 
          : 'left-1 bg-white dark:bg-zinc-400'
        }
      `} />
    </button>
  );

  const renderEditorTab = () => {
    const currentEditor = presetEditors.find(e => e.id === selectedEditor) || customEditors.find(e => e.id === selectedEditor);
    const editorName = currentEditor?.name || 'Editor';
    const editorCommand = currentEditor?.command || 'code';
    
    return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('settings.editorHint')}</p>
      
      <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">{t('settings.editorSetupTitle')}</p>
        <p className="text-xs text-amber-600 dark:text-amber-500 mb-2">{t('settings.editorSetupDesc', { editor: editorName })}</p>
        <code className="block text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded font-mono">
          {t('settings.editorSetupCommand', { command: editorCommand })}
        </code>
      </div>
      
      <div className="space-y-1">
        {presetEditors.map(editor => (
          <button
            key={editor.id}
            onClick={() => setSelectedEditor(editor.id)}
            className={`
              w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all
              ${selectedEditor === editor.id 
                ? 'bg-zinc-100 dark:bg-white/5' 
                : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                ${selectedEditor === editor.id 
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100' 
                  : 'border-zinc-300 dark:border-zinc-600'
                }
              `}>
                {selectedEditor === editor.id && <Check size={10} className="text-white dark:text-zinc-900" strokeWidth={3} />}
              </div>
              <span className={`text-sm ${selectedEditor === editor.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {editor.name}
              </span>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">{editor.command}</span>
          </button>
        ))}
        
        {customEditors.map(editor => (
          <div
            key={editor.id}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
              ${selectedEditor === editor.id 
                ? 'bg-zinc-100 dark:bg-white/5' 
                : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
              }
            `}
          >
            <button
              type="button"
              onClick={() => setSelectedEditor(editor.id)}
              className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                ${selectedEditor === editor.id 
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100' 
                  : 'border-zinc-300 dark:border-zinc-600'
                }
              `}
            >
              {selectedEditor === editor.id && <Check size={10} className="text-white dark:text-zinc-900" strokeWidth={3} />}
            </button>
            <input
              type="text"
              value={editor.name}
              onChange={(e) => handleCustomEditorChange(editor.id, 'name', e.target.value)}
              placeholder={t('editorConfig.namePlaceholder')}
              className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
            />
            <input
              type="text"
              value={editor.command}
              onChange={(e) => handleCustomEditorChange(editor.id, 'command', e.target.value)}
              placeholder={t('editorConfig.commandPlaceholder')}
              className="w-20 bg-transparent text-xs font-mono text-zinc-400 dark:text-zinc-500 placeholder-zinc-300 dark:placeholder-zinc-700 focus:outline-none text-right"
            />
            <button
              onClick={() => handleRemoveCustomEditor(editor.id)}
              className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleAddCustomEditor}
        className="w-full px-3 py-2 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={12} />
        {t('settings.addCustomEditor')}
      </button>
    </div>
  );};

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
        <img 
          src={isDarkMode ? "/assets/logo-dark.svg" : "/assets/logo-light.svg"} 
          alt="DevDock" 
          className="h-10 w-auto"
        />
        <div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">DevDock</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">v{appVersion}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">{t('settings.language')}</p>
        <div className="space-y-1">
          {LANGUAGES.map(lang => (
            <RadioOption
              key={lang.code}
              selected={language === lang.code}
              onClick={() => setLanguage(lang.code)}
            >
              {lang.name}
            </RadioOption>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{t('settings.analyticsTitle')}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{t('settings.analyticsDesc')}</p>
        </div>
        <Toggle 
          checked={analyticsEnabled} 
          onChange={(enabled) => {
            setAnalyticsEnabled(enabled);
            analytics.setConsent(enabled);
            showToast(enabled ? t('toast.analyticsEnabled') : t('toast.analyticsDisabled'), 'success');
          }} 
        />
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-3">{t('settings.softwareUpdate')}</p>
        {updateInfo?.downloaded ? (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">
              {t('settings.updateDownloaded', { version: updateInfo.version })}
            </p>
            <button
              onClick={handleInstallUpdate}
              className="w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {t('settings.restartAndInstall')}
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            className="w-full px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={12} className={checkingUpdate ? 'animate-spin' : ''} />
            {checkingUpdate ? t('settings.checking') : t('settings.checkUpdate')}
          </button>
        )}
      </div>
    </div>
  );

  const renderShortcutsTab = () => (
    <div className="space-y-1">
      {SHORTCUTS.map((shortcut, index) => (
        <div
          key={index}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{t(shortcut.descKey)}</span>
          <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {shortcut.key}
          </kbd>
        </div>
      ))}
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('settings.theme')}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => isDarkMode && toggleTheme()}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
            ${!isDarkMode
              ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-white/5'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }
          `}
        >
          <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-300" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">{t('settings.themeLight')}</span>
          {!isDarkMode && <Check size={14} className="ml-auto text-zinc-900 dark:text-zinc-100" />}
        </button>
        <button
          onClick={() => !isDarkMode && toggleTheme()}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
            ${isDarkMode
              ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-white/5'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }
          `}
        >
          <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">{t('settings.themeDark')}</span>
          {isDarkMode && <Check size={14} className="ml-auto text-zinc-900 dark:text-zinc-100" />}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
        return renderEditorTab();
      case 'general':
        return renderGeneralTab();
      case 'shortcuts':
        return renderShortcutsTab();
      case 'appearance':
        return renderAppearanceTab();
      default:
        return renderGeneralTab();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#0c0c0e] rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT, height: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-white/5 px-5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 -mb-px transition-colors
                  ${activeTab === tab.id
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }
                `}
              >
                <Icon size={14} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-white/5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t('action.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-medium transition-colors"
          >
            {t('action.save')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
