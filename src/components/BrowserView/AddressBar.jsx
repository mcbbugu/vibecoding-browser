import React from 'react';
import { Lock, AlertTriangle, Copy } from 'lucide-react';

const getSecurityIcon = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const isSecure = urlObj.protocol === 'https:';
    const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' || urlObj.hostname.startsWith('192.168.');
    
    if (isSecure) {
      return <Lock size={14} className="text-emerald-500" />;
    } else if (isLocalhost) {
      return <Lock size={14} className="text-zinc-400" />;
    } else {
      return <AlertTriangle size={14} className="text-amber-500" />;
    }
  } catch {
    return null;
  }
};

export const AddressBar = ({ 
  url, 
  onUrlChange, 
  onUrlSubmit,
  onCopyUrl,
  project,
  projects,
  onSelectProject 
}) => {
  const securityIcon = getSecurityIcon(url);
  
  return (
    <div className="flex-1 flex items-center gap-2">
      <form onSubmit={onUrlSubmit} className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 focus-within:bg-zinc-200 dark:focus-within:bg-zinc-800 transition-colors">
        {securityIcon && (
          <div className="shrink-0 flex items-center">
            {securityIcon}
          </div>
        )}
        <input 
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="localhost:3000"
          data-address-bar="true"
          className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
        />
      </form>
      <button 
        type="button"
        onClick={onCopyUrl}
        className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="复制"
      >
        <Copy size={14} />
      </button>
    </div>
  );
};

