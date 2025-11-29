import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Z_INDEX } from '../utils/constants';

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success': 
        return {
          icon: <CheckCircle size={18} className="text-emerald-500" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          border: 'border-emerald-200 dark:border-emerald-800/50',
          text: 'text-emerald-900 dark:text-emerald-100'
        };
      case 'error': 
        return {
          icon: <AlertCircle size={18} className="text-rose-500" />,
          bg: 'bg-rose-50 dark:bg-rose-950/50',
          border: 'border-rose-200 dark:border-rose-800/50',
          text: 'text-rose-900 dark:text-rose-100'
        };
      default: 
        return {
          icon: <Info size={18} className="text-indigo-500" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/50',
          border: 'border-indigo-200 dark:border-indigo-800/50',
          text: 'text-indigo-900 dark:text-indigo-100'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 animate-slide-down pointer-events-none" style={{ zIndex: 999999 }}>
      <div className={`${styles.bg} ${styles.border} ${styles.text} backdrop-blur-xl px-3 py-2 rounded-xl shadow-md border flex items-center gap-2 pointer-events-auto`}>
        <div className="shrink-0">
          {React.cloneElement(styles.icon, { size: 14 })}
        </div>
        <span className="text-xs font-medium leading-tight">{toast.message}</span>
        <button 
          onClick={onClose} 
          className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X size={12} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
};
