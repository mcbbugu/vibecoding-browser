import React from 'react';
import { Project, ActivityLog } from '../types';
import { MOCK_ACTIVITIES } from '../constants';
import { Activity, Cpu, HardDrive, Zap, Clock, ArrowRight, Terminal } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, onSelectProject }) => {
  const runningProjects = projects.filter(p => p.status === 'running');
  const recentProjects = [...projects].sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running')).slice(0, 3);

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-zinc-50 dark:bg-[#111111] transition-colors duration-300">
        <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Good morning, Developer.</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">System is optimal. {runningProjects.length} active services running.</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-2xl font-mono font-medium text-zinc-800 dark:text-zinc-200">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div className="text-sm text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold">{new Date().toLocaleDateString([], {weekday: 'long', month: 'short', day: 'numeric'})}</div>
                </div>
            </div>

            {/* System Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1c1c1f] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                    <div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">CPU Load</div>
                        <div className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">12%</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Cpu size={20} className="text-indigo-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1c1c1f] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                    <div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Memory</div>
                        <div className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">4.2 GB</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <HardDrive size={20} className="text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1c1c1f] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between group hover:border-amber-500/30 transition-colors">
                    <div>
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Uptime</div>
                        <div className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">4h 20m</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                        <Clock size={20} className="text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Recent Projects */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quick Access</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recentProjects.map(project => (
                            <button 
                                key={project.id}
                                onClick={() => onSelectProject(project.id)}
                                className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-4 w-full">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${project.status === 'running' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                        <Zap size={20} className={project.status === 'running' ? 'fill-emerald-500/20' : ''} />
                                    </div>
                                    {project.status === 'running' && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Running</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto">
                                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">{project.name}</h3>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-mono truncate">{project.path}</p>
                                </div>
                            </button>
                        ))}
                        <button className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-50/5 dark:hover:bg-indigo-500/5 text-zinc-400 hover:text-indigo-500 transition-all gap-2 group">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                                <ArrowRight size={20} />
                            </div>
                            <span className="text-sm font-medium">View All Projects</span>
                        </button>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={14} />
                        Recent Activity
                    </h2>
                    <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
                        {MOCK_ACTIVITIES.map((log, idx) => (
                            <div key={log.id} className={`p-4 flex gap-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors`}>
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 
                                    ${log.type === 'success' ? 'bg-emerald-500' : ''}
                                    ${log.type === 'error' ? 'bg-rose-500' : ''}
                                    ${log.type === 'info' ? 'bg-blue-500' : ''}
                                `} />
                                <div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-none mb-1.5">{log.message}</p>
                                    <p className="text-[10px] text-zinc-400 font-mono">{log.timestamp}</p>
                                </div>
                            </div>
                        ))}
                        <div className="p-3 bg-zinc-50 dark:bg-black/20 text-center">
                            <button className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium flex items-center justify-center gap-1 w-full">
                                <Terminal size={10} /> View Full Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};