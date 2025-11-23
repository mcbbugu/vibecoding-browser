import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Edit2, Plus } from 'lucide-react';

export const SpaceManageModal = ({ 
  isOpen, 
  onClose, 
  spaces, 
  onCreateSpace, 
  onUpdateSpace, 
  onDeleteSpace,
  activeSpaceId,
  setActiveSpaceId,
  showToast
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newSpaceName, setNewSpaceName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditingName('');
      setNewSpaceName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveEdit = (id) => {
    if (editingName.trim()) {
      onUpdateSpace(id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      showToast('空间已更新', 'success');
    }
  };

  const handleCreate = () => {
    if (newSpaceName.trim()) {
      onCreateSpace(newSpaceName.trim());
      setNewSpaceName('');
      showToast('空间已创建', 'success');
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`确定要删除空间 "${name}" 吗？此操作无法撤销。`)) {
      if (activeSpaceId === id && spaces.length > 1) {
        const nextSpace = spaces.find(s => s.id !== id);
        if (nextSpace) {
          setActiveSpaceId(nextSpace.id);
        }
      }
      onDeleteSpace(id);
      showToast('空间已删除', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">管理空间</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {spaces.map(space => (
              <div
                key={space.id}
                className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
              >
                {editingId === space.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(space.id);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingName('');
                        }
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-zinc-900 border border-indigo-500 rounded-md text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSaveEdit(space.id)}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                      title="保存"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors"
                      title="取消"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {space.name}
                        {activeSpaceId === space.id && (
                          <span className="ml-2 text-xs text-indigo-500">(当前)</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(space.id);
                        setEditingName(space.name);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    {spaces.length > 1 && (
                      <button
                        onClick={() => handleDelete(space.id, space.name)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
                placeholder="新空间名称"
                className="flex-1 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

