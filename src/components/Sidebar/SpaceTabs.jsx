import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export const SpaceTabs = ({ spaces, activeSpaceId, onSelectSpace, onCreateSpace }) => {
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const handleCreateSpace = (e) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      onCreateSpace(newSpaceName.trim());
      setNewSpaceName('');
      setIsCreatingSpace(false);
    }
  };

  return (
    <div className="px-4 mb-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-2 font-semibold px-1">
        自建空间
      </div>
      <div className="flex gap-2 p-1 bg-zinc-200/50 dark:bg-black/20 rounded-lg backdrop-blur-sm overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max flex-1">
          {spaces.map(space => (
            <button
              key={space.id}
              onClick={() => onSelectSpace(space.id)}
              className={`
                flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-300 text-xs font-medium whitespace-nowrap
                ${activeSpaceId === space.id 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'}
              `}
              title={space.name}
            >
              {space.name}
            </button>
          ))}
          {isCreatingSpace && (
            <form onSubmit={handleCreateSpace} className="flex-shrink-0">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onBlur={() => {
                  if (!newSpaceName.trim()) setIsCreatingSpace(false);
                }}
                autoFocus
                placeholder="空间名称"
                className="px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium border-2 border-indigo-500 focus:outline-none min-w-[100px]"
              />
            </form>
          )}
        </div>
        <button
          onClick={() => setIsCreatingSpace(true)}
          className="flex-shrink-0 p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
          title="创建空间"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

