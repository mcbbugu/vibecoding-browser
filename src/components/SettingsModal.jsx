import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Code, Keyboard, Palette, Settings as SettingsIcon, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { storage } from '../utils/storage';
import { Z_INDEX } from '../utils/constants';

const LANGUAGES = [
  { code: 'zh', name: '简体中文' },
  { code: 'en', name: 'English' },
];

export const SettingsModal = ({ isOpen, onClose, showToast, isDarkMode, toggleTheme }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedEditor, setSelectedEditor] = useState('cursor');
  const [customEditors, setCustomEditors] = useState([]);
  const [language, setLanguage] = useState(i18n.language || 'zh');
  const [autoStart, setAutoStart] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(false);

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
      const savedAutoStart = storage.get('autoStart', false);
      const savedMinimizeToTray = storage.get('minimizeToTray', false);
      
      setSelectedEditor(savedEditor);
      setCustomEditors(savedCustomEditors);
      setLanguage(i18n.language || 'zh');
      setAutoStart(savedAutoStart);
      setMinimizeToTray(savedMinimizeToTray);
    }
  }, [isOpen, i18n.language]);

  if (!isOpen) return null;

  const handleSave = () => {
    storage.set('selectedEditor', selectedEditor);
    storage.set('customEditors', customEditors);
    storage.set('autoStart', autoStart);
    storage.set('minimizeToTray', minimizeToTray);
    i18n.changeLanguage(language);
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

  const allEditors = [...presetEditors, ...customEditors];

  const tabs = [
    { id: 'editor', labelKey: 'settings.editor', icon: Code },
    { id: 'general', labelKey: 'settings.general', icon: SettingsIcon },
    { id: 'shortcuts', labelKey: 'settings.shortcuts', icon: Keyboard },
    { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
  ];

  const renderEditorTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          {t('settings.editorHint')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t('settings.editor')}
        </label>
        <div className="space-y-2">
          {presetEditors.map(editor => (
            <label
              key={editor.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedEditor === editor.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <input
                type="radio"
                name="editor"
                value={editor.id}
                checked={selectedEditor === editor.id}
                onChange={() => setSelectedEditor(editor.id)}
                className="w-4 h-4 text-indigo-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{editor.name}</span>
              <span className="text-xs text-zinc-400 ml-auto font-mono">{editor.command}</span>
            </label>
          ))}
          
          {customEditors.map(editor => (
            <div
              key={editor.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selectedEditor === editor.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="editor"
                value={editor.id}
                checked={selectedEditor === editor.id}
                onChange={() => setSelectedEditor(editor.id)}
                className="w-4 h-4 text-indigo-500"
              />
              <input
                type="text"
                value={editor.name}
                onChange={(e) => handleCustomEditorChange(editor.id, 'name', e.target.value)}
                placeholder={t('editorConfig.namePlaceholder')}
                className="flex-1 px-2 py-1 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={editor.command}
                onChange={(e) => handleCustomEditorChange(editor.id, 'command', e.target.value)}
                placeholder={t('editorConfig.commandPlaceholder')}
                className="w-24 px-2 py-1 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-xs font-mono text-zinc-400 focus:outline-none focus:border-indigo-500"
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
          className="w-full mt-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          {t('settings.addCustomEditor')}
        </button>
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          {t('settings.language')}
        </label>
        <div className="space-y-2">
          {LANGUAGES.map(lang => (
            <label
              key={lang.code}
              className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={language === lang.code}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-4 h-4 text-indigo-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{lang.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.autoStart')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t('settings.autoStartHint')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.minimizeToTray')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t('settings.minimizeToTrayHint')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={minimizeToTray}
              onChange={(e) => setMinimizeToTray(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderShortcutsTab = () => (
    <div className="space-y-4">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          {t('settings.shortcutsHint')}
        </p>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-700 last:border-0"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{t(shortcut.descKey)}</span>
              <kbd className="px-2 py-1 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          {t('settings.theme')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => isDarkMode && toggleTheme()}
            className={`p-4 rounded-lg border-2 transition-all ${
              !isDarkMode
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-8 bg-white border border-zinc-200 rounded mx-auto mb-2"></div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.themeLight')}</p>
            </div>
          </button>
          <button
            onClick={() => !isDarkMode && toggleTheme()}
            className={`p-4 rounded-lg border-2 transition-all ${
              isDarkMode
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-8 bg-zinc-800 border border-zinc-700 rounded mx-auto mb-2"></div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.themeDark')}</p>
            </div>
          </button>
        </div>
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
        return renderEditorTab();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm"
      style={{ 
        zIndex: Z_INDEX.MODAL_BACKDROP,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl mx-4 border border-zinc-200 dark:border-zinc-800 flex flex-col"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT, height: '600px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-1 overflow-y-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {t('action.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2"
          >
            <Save size={16} />
            {t('action.save')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

