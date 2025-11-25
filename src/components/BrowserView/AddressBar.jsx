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
    <div className="flex-1 max-w-3xl mx-auto group relative">
      {securityIcon && (
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {securityIcon}
        </div>
      )}
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

