import React from 'react';
import { ChevronDown, User } from 'lucide-react';

export const SidebarHeader = () => {
  return (
    <div className="p-4 pt-5 flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <div className="w-2.5 h-2.5 bg-white rounded-full" />
        </div>
        <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm tracking-tight">VibeCoding</span>
        <ChevronDown size={12} className="opacity-50" />
      </div>
      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
        <User size={14} className="text-zinc-500" />
      </div>
    </div>
  );
};

