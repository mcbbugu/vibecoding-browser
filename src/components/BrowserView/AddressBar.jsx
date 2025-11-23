import React from 'react';
import { Lock, Copy, Link2, Monitor, Globe } from 'lucide-react';

export const AddressBar = ({ 
  url, 
  onUrlChange, 
  onUrlSubmit,
  onCopyUrl,
  project,
  projects,
  onSelectProject 
}) => {
  return (
    <div className="flex-1 max-w-3xl mx-auto group relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Lock size={12} className="text-emerald-500" />
      </div>
      <form onSubmit={onUrlSubmit} className="w-full">
        <input 
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="Enter URL (e.g., localhost:3000)"
          data-address-bar="true"
          className="w-full bg-zinc-100 dark:bg-[#111111] hover:bg-zinc-50 dark:hover:bg-black transition-all rounded-xl pl-9 pr-10 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-medium border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 outline-none shadow-inner text-center"
        />
      </form>
      {project?.boundProjectId && (() => {
        const boundProject = projects.find(p => p.id === project.boundProjectId);
        if (!boundProject) return null;
        const boundCategory = boundProject.path || boundProject.port ? 'local' : 'online';
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectProject(boundProject.id);
            }}
            className="absolute inset-y-0 right-10 flex items-center gap-1.5 px-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
            title={`切换到${boundCategory === 'local' ? '本地' : '线上'}版本: ${boundProject.name}`}
          >
            <Link2 size={12} />
            {boundCategory === 'local' ? <Monitor size={12} /> : <Globe size={12} />}
          </button>
        );
      })()}
      <button 
        onClick={onCopyUrl}
        className="absolute inset-y-0 right-2 flex items-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        title="Copy URL"
      >
        <Copy size={14} />
      </button>
    </div>
  );
};

