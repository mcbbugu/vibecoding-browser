import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { electronAPI } from '../../utils/electron';

export const TerminalPanel = ({ 
  showTerminal, 
  terminalLogs, 
  project,
  onClear,
  onClose,
  onAddLog
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (showTerminal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTerminal]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  if (!showTerminal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !project?.pid) return;

    const command = input.trim();
    setInput('');
    
    if (onAddLog) {
      onAddLog({ type: 'input', message: `➜ ${command}` });
    }

    try {
      const result = await electronAPI.sendTerminalInput(project.pid, command);
      if (!result.success && onAddLog) {
        onAddLog({ type: 'error', message: result.error || 'Failed to send command' });
      }
    } catch (error) {
      if (onAddLog) {
        onAddLog({ type: 'error', message: error.message });
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-zinc-900/95 dark:bg-[#0e0e10]/95 backdrop-blur-xl border-t border-zinc-700 dark:border-white/10 p-0 font-mono text-xs text-zinc-400 overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transition-all animate-slide-up z-30 flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-800/50 dark:bg-white/5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={12} />
          <span className="font-bold text-zinc-300">Terminal</span>
          {project?.pid && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-700 dark:bg-white/10 text-[10px]">
              PID: {project.pid}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClear} 
            className="hover:text-white transition-colors"
          >
            Clear
          </button>
          <button onClick={onClose} className="hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
      <div className="p-4 overflow-y-auto flex-1 space-y-1.5 font-medium selection:bg-white/20 selection:text-white">
        {terminalLogs.length > 0 ? (
          terminalLogs.map((log, idx) => (
            <div key={idx} className={`text-zinc-300 flex gap-2 ${
              log.type === 'error' ? 'text-rose-500' : 
              log.type === 'success' ? 'text-emerald-400' : 
              log.type === 'info' ? 'text-blue-400' : 
              log.type === 'input' ? 'text-emerald-400' : ''
            }`}>
              {log.type && log.type !== 'input' && <span className="text-[10px] uppercase">{log.type}</span>}
              <span>{log.message}</span>
            </div>
          ))
        ) : (
          <>
            {project?.path && (
              <>
                <div className="text-emerald-400">➜  ~  cd {project.path} && npm run dev</div>
                <div className="text-zinc-300">&gt; {project.name}@0.1.0 dev</div>
                {project.type === 'next' && (
                  <div className="text-zinc-300">&gt; next dev -p {project.port}</div>
                )}
                <br/>
              </>
            )}
            {project?.status === 'running' && (
              <>
                <div className="text-zinc-300 flex gap-2">
                  <span className="text-blue-400">info</span> 
                  <span>- started server on 0.0.0.0:{project.port || 'port'}, url: http://localhost:{project.port || 'port'}</span>
                </div>
                <div className="text-zinc-300 flex gap-2">
                  <span className="text-emerald-400">event</span> 
                  <span>- compiled successfully</span>
                </div>
              </>
            )}
            {project?.status === 'error' && (
              <div className="text-rose-500 mt-2 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                Error: EADDRINUSE: address already in use ::: {project.port}
              </div>
            )}
          </>
        )}
        <div ref={logsEndRef} />
      </div>
      {project?.pid && (
        <form onSubmit={handleSubmit} className="px-4 py-2 border-t border-zinc-700 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">➜</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-zinc-300 placeholder-zinc-600"
              placeholder="输入命令..."
              autoFocus
            />
          </div>
        </form>
      )}
    </div>
  );
};

