import React from 'react';
import { LayoutDashboard, ShoppingCart, Activity, Globe, Box, Flame } from 'lucide-react';

export const SPACES = [];

export const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'VibeCoding Dashboard',
    url: 'http://localhost:3000',
    port: 3000,
    status: 'running',
    space: 'work',
    path: '~/dev/vibecoding/dashboard',
    type: 'next',
  },
  {
    id: '2',
    name: 'E-Commerce API',
    url: 'http://localhost:8080',
    port: 8080,
    status: 'stopped',
    space: 'work',
    path: '~/dev/client/api',
    type: 'node',
  },
  {
    id: '3',
    name: 'Personal Blog',
    url: 'http://localhost:5173',
    port: 5173,
    status: 'running',
    space: 'personal',
    path: '~/dev/blog',
    type: 'vite',
  },
  {
    id: '4',
    name: 'Analytics Service',
    url: 'http://localhost:4000',
    port: 4000,
    status: 'error',
    space: 'work',
    path: '~/dev/vibecoding/analytics',
    type: 'python',
  },
  {
    id: '5',
    name: 'UI Component Library',
    url: 'http://localhost:6006',
    port: 6006,
    status: 'stopped',
    space: 'tools',
    path: '~/dev/design-system',
    type: 'react',
  },
];

export const MOCK_ACTIVITIES = [
    { id: '1', projectId: '1', message: 'Build completed in 1.2s', timestamp: 'Just now', type: 'success' },
    { id: '2', projectId: '3', message: 'Hot Reload connected', timestamp: '2m ago', type: 'info' },
    { id: '3', projectId: '4', message: 'Process crashed (PID 4021)', timestamp: '15m ago', type: 'error' },
    { id: '4', projectId: '2', message: 'Server stopped by user', timestamp: '1h ago', type: 'info' },
];

export const getIconForType = (type) => {
    switch(type) {
        case 'next': return LayoutDashboard;
        case 'react': return Box;
        case 'vite': return Flame;
        case 'node': return Globe;
        case 'python': return Activity;
        default: return Box;
    }
};

export const PROJECT_CATEGORY_LABELS = {
    local: '本地开发',
    online: '在线域名'
};

export const getProjectCategory = (project = {}) => {
    if (!project) return 'online';
    if (project.category === 'local' || project.category === 'online') return project.category;
    const normalizedUrl = (project.url || '').toLowerCase();
    if (project.path) return 'local';
    if (typeof project.port === 'number' && project.port) return 'local';
    if (normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1') || normalizedUrl.includes('0.0.0.0')) {
        return 'local';
    }
    const privateNetworkPattern = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01]))/;
    if (privateNetworkPattern.test(normalizedUrl)) return 'local';
    return 'online';
};

