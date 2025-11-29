import React from 'react';
import { Code, Camera, Bug, RefreshCw, Trash2, ShieldOff, Network } from 'lucide-react';
import { Tooltip } from '../Tooltip';

export const BrowserActions = ({
  project,
  isDevToolsOpen,
  isCacheDisabled,
  onOpenEditor,
  onToggleDevTools,
  onOpenNetworkPanel,
  onCaptureScreenshot,
  onHardReload,
  onClearStorage,
  onToggleCacheDisabled
}) => {
  return (
    <>
      <div className="flex items-center gap-1">
        <Tooltip message="在编辑器中打开" position="top">
          <button 
            onClick={() => project && onOpenEditor(project)}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <Code size={16} />
          </button>
        </Tooltip>
        <Tooltip message={isDevToolsOpen ? "关闭控制台" : "打开控制台"} position="top">
          <button 
            onClick={onToggleDevTools}
            className={`transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5 ${isDevToolsOpen ? 'text-indigo-500 dark:text-indigo-400' : 'hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          >
            <Bug size={16} />
          </button>
        </Tooltip>
        <Tooltip message="网络请求" position="top">
          <button 
            onClick={onOpenNetworkPanel}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <Network size={16} />
          </button>
        </Tooltip>
        <Tooltip message="截图" position="top">
          <button 
            onClick={onCaptureScreenshot}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <Camera size={16} />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

      <div className="flex items-center gap-1">
        <Tooltip message="清除缓存并刷新" position="top">
          <button 
            onClick={onHardReload}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <RefreshCw size={16} />
          </button>
        </Tooltip>
        <Tooltip message="清除存储" position="top">
          <button 
            onClick={onClearStorage}
            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <Trash2 size={16} />
          </button>
        </Tooltip>
        <Tooltip message={isCacheDisabled ? "启用缓存" : "禁用缓存"} position="top">
          <button 
            onClick={onToggleCacheDisabled}
            className={`transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5 ${
              isCacheDisabled 
                ? 'text-orange-500 dark:text-orange-400' 
                : 'hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldOff size={16} />
          </button>
        </Tooltip>
      </div>
    </>
  );
};

