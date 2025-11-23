import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'error': return <AlertCircle size={16} className="text-rose-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white dark:bg-[#27272a] text-zinc-800 dark:text-white px-4 py-3 rounded-full shadow-2xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3 min-w-[300px]">
        {getIcon()}
        <span className="text-sm font-medium flex-1">{toast.message}</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={14} />
        </button>
      </div>
    </div>
  );
};

