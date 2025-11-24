import React from 'react';
import { AlertCircle } from 'lucide-react';

export const BrowserContent = ({ 
  browserContainerRef,
  selectedDevice,
  canDisplayWebview,
  requiresLocalService,
  isLoading,
  project,
  onOpenEdit,
  showToast
}) => {
  return (
    <div 
      className={`flex-1 relative bg-zinc-100 dark:bg-[#0e0e10] overflow-hidden ${selectedDevice.category !== 'desktop' ? 'flex items-center justify-center p-4' : ''}`}
    >
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
          />
        </>
      ) : requiresLocalService ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0e0e10] z-10 transition-colors">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full transition-colors duration-500" />
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10">
              <AlertCircle size={36} className="text-zinc-400" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">Service Stopped</h3>
          <p className="text-zinc-500 text-base mt-2 mb-8 text-center max-w-xs leading-relaxed">
            The development server for <br/><span className="font-medium text-zinc-800 dark:text-zinc-200">{project.name}</span> is currently inactive.
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
            Please start the server in your code editor to preview.
          </p>
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

