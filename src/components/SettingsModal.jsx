import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Code, Globe, Keyboard, Palette, Settings as SettingsIcon, Plus, Trash2 } from 'lucide-react';
import { storage } from '../utils/storage';
import { Z_INDEX } from '../utils/constants';

const SHORTCUTS = [
  { key: '⌘K', description: '搜索项目' },
  { key: '⌘T', description: '新建标签页' },
  { key: '⌘W', description: '关闭标签页' },
  { key: '⌘R', description: '刷新页面' },
  { key: '⌘L', description: '聚焦地址栏' },
  { key: '⌘S', description: '切换侧边栏（双击）' },
  { key: '⌘F', description: '页面搜索' },
  { key: '⌘Tab', description: '下一个标签页' },
  { key: '⌘⇧Tab', description: '上一个标签页' },
  { key: '⌘[', description: '后退' },
  { key: '⌘]', description: '前进' },
];

const LANGUAGES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
];

export const SettingsModal = ({ isOpen, onClose, showToast, isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [editorConfig, setEditorConfig] = useState({
    command: 'code',
    args: ['{path}']
  });
  const [language, setLanguage] = useState('zh-CN');
  const [autoStart, setAutoStart] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedEditorConfig = storage.get('editorConfig', { command: 'code', args: ['{path}'] });
      const savedLanguage = storage.get('language', 'zh-CN');
      const savedAutoStart = storage.get('autoStart', false);
      const savedMinimizeToTray = storage.get('minimizeToTray', false);
      
      setEditorConfig(savedEditorConfig);
      setLanguage(savedLanguage);
      setAutoStart(savedAutoStart);
      setMinimizeToTray(savedMinimizeToTray);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    storage.set('editorConfig', editorConfig);
    storage.set('language', language);
    storage.set('autoStart', autoStart);
    storage.set('minimizeToTray', minimizeToTray);
    showToast('设置已保存', 'success');
    onClose();
  };

  const handleAddArg = () => {
    setEditorConfig(prev => ({
      ...prev,
      args: [...prev.args, '']
    }));
  };

  const handleRemoveArg = (index) => {
    setEditorConfig(prev => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index)
    }));
  };

  const handleArgChange = (index, value) => {
    setEditorConfig(prev => ({
      ...prev,
      args: prev.args.map((arg, i) => i === index ? value : arg)
    }));
  };

  const presetEditors = [
    { name: 'VS Code', command: 'code', args: ['{path}'] },
    { name: 'Cursor', command: 'cursor', args: ['{path}'] },
    { name: 'Windsurf', command: 'windsurf', args: ['{path}'] },
    { name: 'Sublime Text', command: 'subl', args: ['{path}'] },
    { name: 'Atom', command: 'atom', args: ['{path}'] },
    { name: 'WebStorm', command: 'webstorm', args: ['{path}'] },
  ];

  const handlePresetSelect = (preset) => {
    setEditorConfig({
      command: preset.command,
      args: [...preset.args]
    });
  };

  const tabs = [
    { id: 'editor', label: '编辑器', icon: Code },
    { id: 'general', label: '通用', icon: SettingsIcon },
    { id: 'shortcuts', label: '快捷键', icon: Keyboard },
    { id: 'appearance', label: '外观', icon: Palette },
  ];

  const renderEditorTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>使用说明：</strong>确保编辑器命令已添加到系统 PATH 中。在终端运行 <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">which {editorConfig.command || 'code'}</code> 检查命令是否可用。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          预设编辑器
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presetEditors.map(preset => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                editorConfig.command === preset.command
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          命令
        </label>
        <input
          type="text"
          value={editorConfig.command}
          onChange={(e) => setEditorConfig(prev => ({ ...prev, command: e.target.value }))}
          placeholder="例如: code, cursor, subl"
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-zinc-400 mt-1">
          命令名称（需要在系统 PATH 中）
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          参数
        </label>
        <div className="space-y-2">
          {editorConfig.args.map((arg, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={arg}
                onChange={(e) => handleArgChange(index, e.target.value)}
                placeholder="例如: {path}"
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {editorConfig.args.length > 1 && (
                <button
                  onClick={() => handleRemoveArg(index)}
                  className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddArg}
            className="w-full px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            添加参数
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-1">使用 {'{path}'} 作为项目路径占位符</p>
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          语言
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
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">开机自启动</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">应用启动时自动打开</p>
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
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">最小化到托盘</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">关闭窗口时最小化到系统托盘</p>
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
          以下是应用内可用的快捷键列表
        </p>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-700 last:border-0"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{shortcut.description}</span>
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
          主题
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => !isDarkMode && toggleTheme()}
            className={`p-4 rounded-lg border-2 transition-all ${
              !isDarkMode
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-8 bg-white border border-zinc-200 rounded mx-auto mb-2"></div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">浅色</p>
            </div>
          </button>
          <button
            onClick={() => isDarkMode && toggleTheme()}
            className={`p-4 rounded-lg border-2 transition-all ${
              isDarkMode
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-8 bg-zinc-800 border border-zinc-700 rounded mx-auto mb-2"></div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">深色</p>
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
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
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
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl mx-4 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">设置</h2>
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
                  <span>{tab.label}</span>
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
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

