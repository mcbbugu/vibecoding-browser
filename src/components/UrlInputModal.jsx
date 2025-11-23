import React, { useState, useEffect } from 'react';
import { X, Monitor, Globe } from 'lucide-react';
import { normalizeUrl, isSearchQuery, createSearchUrl } from '../utils/url';
import { electronAPI } from '../utils/electron';

export const UrlInputModal = ({ isOpen, onClose, onSave, activeSpaceId }) => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('online');
  const [localIPs, setLocalIPs] = useState(['localhost', '127.0.0.1']);
  const [selectedHost, setSelectedHost] = useState('localhost');
  const [port, setPort] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setCategory('online');
      setSelectedHost('localhost');
      setPort('');
      electronAPI.getLocalIPs().then(ips => {
        if (ips && ips.length > 0) {
          setLocalIPs(ips);
          setSelectedHost(ips[0]);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let finalUrl;
    let projectName;
    let finalPort = null;

    if (category === 'local') {
      const trimmedPort = port.trim();
      if (!trimmedPort) return;
      
      finalPort = parseInt(trimmedPort);
      if (isNaN(finalPort) || finalPort < 1 || finalPort > 65535) {
        return;
      }
      
      finalUrl = `http://${selectedHost}:${finalPort}`;
      projectName = `${selectedHost === 'localhost' || selectedHost === '127.0.0.1' ? 'localhost' : selectedHost}:${finalPort}`;
    } else {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return;

      if (isSearchQuery(trimmedUrl)) {
        finalUrl = createSearchUrl(trimmedUrl);
        projectName = 'Search: ' + trimmedUrl;
      } else {
        finalUrl = normalizeUrl(trimmedUrl);
        projectName = finalUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'New Project';
      }
    }

    onSave({
      name: projectName,
      url: finalUrl,
      port: finalPort,
      status: 'stopped',
      space: activeSpaceId,
      path: '',
      type: 'web',
      note: '',
      category: category
    });
    setUrl('');
    setPort('');
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" 
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1c1c1f] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">新建网页</h2>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">类型</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory('online')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  category === 'online'
                    ? 'bg-sky-500/10 border-sky-500/50 text-sky-600 dark:text-sky-400'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Globe size={16} />
                <span className="text-sm font-medium">在线域名</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('local')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  category === 'local'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Monitor size={16} />
                <span className="text-sm font-medium">本地开发</span>
              </button>
            </div>
          </div>

          {category === 'local' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">地址</label>
                <select
                  value={selectedHost}
                  onChange={(e) => setSelectedHost(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                >
                  {localIPs.map(ip => (
                    <option key={ip} value={ip}>{ip === 'localhost' || ip === '127.0.0.1' ? 'localhost' : ip}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">端口</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  placeholder="3000"
                  min="1"
                  max="65535"
                  autoFocus
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">网址</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                placeholder="example.com"
                autoFocus
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

