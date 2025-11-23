import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Dashboard } from './Dashboard';
import { RefreshCw, ArrowLeft, ArrowRight, Lock, ExternalLink, Terminal, AlertCircle, Wifi, Cpu, LayoutPanelLeft, Play, Copy, ShieldCheck } from 'lucide-react';

interface BrowserViewProps {
  project: Project | undefined;
  onStatusChange: (id: string) => void;
  projects: Project[];
  onSelectProject: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'info') => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ project, onStatusChange, projects, onSelectProject, showToast }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState(120);

  useEffect(() => {
    if (project) {
      setUrl(project.url);
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 800);
      // Mock memory fluctuation
      const memInterval = setInterval(() => {
        setMemoryUsage(prev => prev + (Math.random() > 0.5 ? 2 : -2));
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(memInterval);
      };
    }
  }, [project]);

  const handleCopyUrl = () => {
      navigator.clipboard.writeText(url);
      showToast('URL copied to clipboard', 'success');
  };

  if (!project) {
    return <Dashboard projects={projects} onSelectProject={onSelectProject} />;
  }

  const isRunning = project.status === 'running';

  return (
    <div className="flex-1 h-full flex flex-col p-3 pl-0 bg-zinc-50 dark:bg-[#111111] overflow-hidden transition-colors duration-300">
      {/* The "Arc" Floating Window Container */}
      <div className="flex-1 bg-white dark:bg-[#1c1c1f] rounded-2xl flex flex-col overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-white/5 relative transition-colors duration-300">
        
        {/* URL / Tool Bar */}
        <div className="h-14 border-b border-zinc-100 dark:border-white/5 flex items-center px-5 gap-4 select-none bg-white dark:bg-[#1c1c1f] transition-colors">
          <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
             <button 
                onClick={() => onSelectProject('')}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 p-1.5 rounded-lg transition-all" 
                title="Back to Dashboard"
             >
                <LayoutPanelLeft size={18} />
             </button>
          </div>
          
          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />

          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
            <button className="hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"><ArrowLeft size={18} /></button>
            <button className="hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"><ArrowRight size={18} /></button>
            <button 
                onClick={() => {
                    setIsLoading(true); 
                    setTimeout(() => setIsLoading(false), 1000);
                }}
                className={`hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 ${isLoading ? 'animate-spin' : ''}`}
            >
                <RefreshCw size={16} />
            </button>
          </div>

          {/* Address Bar */}
          <div className="flex-1 max-w-3xl mx-auto group relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                 <Lock size={12} className="text-emerald-500" />
            </div>
            <input 
                type="text"
                value={url}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="w-full bg-zinc-100 dark:bg-[#111111] hover:bg-zinc-50 dark:hover:bg-black transition-all rounded-xl pl-9 pr-10 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-medium border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 outline-none shadow-inner text-center"
            />
            <button 
                onClick={handleCopyUrl}
                className="absolute inset-y-0 right-2 flex items-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title="Copy URL"
            >
                <Copy size={14} />
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
             {isRunning && (
                 <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono border border-zinc-200 dark:border-white/10 px-2 py-1 rounded-md bg-zinc-50 dark:bg-black/20">
                    <div className="flex items-center gap-1.5" title="Network Activity">
                        <Wifi size={12} className="text-emerald-500" />
                        <span className="text-zinc-600 dark:text-zinc-400">24ms</span>
                    </div>
                    <div className="w-[1px] h-3 bg-zinc-200 dark:bg-white/10" />
                    <div className="flex items-center gap-1.5" title="Memory Usage">
                        <Cpu size={12} className="text-indigo-500" />
                        <span className="text-zinc-600 dark:text-zinc-400">{memoryUsage}MB</span>
                    </div>
                 </div>
             )}

             <button 
                onClick={() => setShowTerminal(!showTerminal)}
                className={`transition-all p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 ${showTerminal ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                title="Toggle Terminal Log"
            >
                <Terminal size={18} />
             </button>
            <button className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" title="Open in default browser">
                <ExternalLink size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-white dark:bg-[#0e0e10] overflow-hidden">
            {isRunning ? (
                <>
                  {isLoading && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-transparent overflow-hidden z-20">
                        <div className="h-full bg-indigo-500 animate-loading-bar w-1/3 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    </div>
                  )}
                  {/* Mock Iframe content */}
                  <div className="w-full h-full overflow-y-auto scroll-smooth bg-zinc-50 dark:bg-[#0e0e10]">
                     <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-8">
                        <div className="w-full max-w-4xl aspect-video bg-white dark:bg-zinc-900 rounded-xl shadow-xl overflow-hidden border border-zinc-200 dark:border-white/5 relative group transition-all duration-700 hover:shadow-2xl">
                            <img 
                                src={`https://picsum.photos/seed/${project.id}/1600/900`} 
                                className="opacity-90 dark:opacity-50 group-hover:opacity-100 dark:group-hover:opacity-80 transition-opacity duration-700 w-full h-full object-cover"
                                alt="Preview"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl p-8 rounded-2xl border border-zinc-200 dark:border-white/10 text-center shadow-2xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={24} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-2">{project.name}</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400">Live on Port <span className="font-mono text-indigo-500">{project.port}</span></p>
                                </div>
                            </div>
                        </div>
                     </div>
                  </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0e0e10] z-10 transition-colors">
                    <div className="relative mb-8 group cursor-pointer" onClick={() => onStatusChange(project.id)}>
                        <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-colors duration-500" />
                        <div className="w-24 h-24 rounded-3xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
                            <AlertCircle size={36} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">Service Stopped</h3>
                    <p className="text-zinc-500 text-base mt-2 mb-8 text-center max-w-xs leading-relaxed">The development server for <br/><span className="font-medium text-zinc-800 dark:text-zinc-200">{project.name}</span> is currently inactive.</p>
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
            )}

            {/* Terminal Overlay */}
            {showTerminal && (
                <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-zinc-900/95 dark:bg-[#0e0e10]/95 backdrop-blur-xl border-t border-zinc-700 dark:border-white/10 p-0 font-mono text-xs text-zinc-400 overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transition-all animate-slide-up z-30 flex flex-col">
                    <div className="flex justify-between items-center px-4 py-2 bg-zinc-800/50 dark:bg-white/5 border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                             <Terminal size={12} />
                             <span className="font-bold text-zinc-300">Terminal Output</span>
                             <span className="px-1.5 py-0.5 rounded bg-zinc-700 dark:bg-white/10 text-[10px]">PID: {Math.floor(Math.random() * 9000) + 1000}</span>
                        </div>
                        <div className="flex gap-3">
                            <button className="hover:text-white transition-colors">Clear</button>
                            <button onClick={() => setShowTerminal(false)} className="hover:text-white transition-colors">Close</button>
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-1.5 font-medium selection:bg-white/20 selection:text-white">
                        <div className="text-emerald-400">➜  ~  cd {project.path} && npm run dev</div>
                        <div className="text-zinc-300">> {project.name}@0.1.0 dev</div>
                        <div className="text-zinc-300">> next dev -p {project.port}</div>
                        <br/>
                        <div className="text-zinc-300 flex gap-2"><span className="text-blue-400">info</span> <span>- started server on 0.0.0.0:{project.port}, url: http://localhost:{project.port}</span></div>
                        <div className="text-zinc-300 flex gap-2"><span className="text-emerald-400">event</span> <span>- compiled client and server successfully in 1241 ms (156 modules)</span></div>
                        <div className="text-zinc-300 flex gap-2"><span className="text-blue-400">wait</span>  <span>- compiling...</span></div>
                        <div className="text-zinc-300 flex gap-2"><span className="text-emerald-400">event</span> <span>- compiled successfully in 123 ms (156 modules)</span></div>
                        {project.status === 'error' && (
                             <div className="text-rose-500 mt-2 bg-rose-500/10 p-2 rounded border border-rose-500/20">Error: EADDRINUSE: address already in use ::: {project.port}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};