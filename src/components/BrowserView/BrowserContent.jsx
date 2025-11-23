import React from 'react';
import { AlertCircle, Play } from 'lucide-react';

export const BrowserContent = ({ 
  browserContainerRef,
  selectedDevice,
  canDisplayWebview,
  requiresLocalService,
  isLoading,
  project,
  onStatusChange,
  onOpenEdit,
  showToast
}) => {
  return (
    <div className={`flex-1 relative bg-zinc-100 dark:bg-[#0e0e10] overflow-hidden ${selectedDevice.category !== 'desktop' ? 'flex items-center justify-center p-4' : ''}`}>
      {canDisplayWebview ? (
        <>
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-transparent overflow-hidden z-20">
              <div className="h-full bg-indigo-500 animate-loading-bar w-1/3 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            </div>
          )}
          <div 
            ref={browserContainerRef}
            className={`bg-white dark:bg-zinc-900 ${selectedDevice.category === 'desktop' ? 'w-full h-full' : 'rounded-lg shadow-2xl border-4 border-zinc-300 dark:border-zinc-700'}`}
            style={{ 
              position: 'relative',
              width: selectedDevice.category === 'desktop' ? '100%' : selectedDevice.width,
              height: selectedDevice.category === 'desktop' ? '100%' : selectedDevice.height,
              maxWidth: selectedDevice.category === 'desktop' ? 'none' : '100%',
              maxHeight: selectedDevice.category === 'desktop' ? 'none' : '100%'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
              Loading...
            </div>
          </div>
        </>
      ) : requiresLocalService ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0e0e10] z-10 transition-colors">
          <div className="relative mb-8 group cursor-pointer" onClick={() => onStatusChange(project.id)}>
            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-colors duration-500" />
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
              <AlertCircle size={36} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">Service Stopped</h3>
          <p className="text-zinc-500 text-base mt-2 mb-8 text-center max-w-xs leading-relaxed">
            The development server for <br/><span className="font-medium text-zinc-800 dark:text-zinc-200">{project.name}</span> is currently inactive.
          </p>
          <button 
            onClick={() => {
              onStatusChange(project.id);
              showToast('Starting server...', 'info');
            }}
            className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-black font-medium text-sm rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Play size={16} className="fill-current" />
            Start Server
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0e0e10] z-10 transition-colors text-center px-6">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Enter a URL to browse</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md">
            This project doesn't require a local server. Paste any website URL above or edit the project details.
          </p>
          <button
            onClick={() => onOpenEdit(project.id)}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all shadow-lg"
          >
            Edit Project
          </button>
        </div>
      )}
    </div>
  );
};

