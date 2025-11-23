import { Project, Space, ActivityLog } from './types';
import { LayoutDashboard, ShoppingCart, Activity, Globe, Box, Flame } from 'lucide-react';
import React from 'react';

export const SPACES: Space[] = [
  { id: 'work', name: 'Work', color: 'bg-blue-500', icon: 'briefcase' },
  { id: 'personal', name: 'Personal', color: 'bg-rose-500', icon: 'user' },
  { id: 'tools', name: 'Tools', color: 'bg-amber-500', icon: 'wrench' },
];

export const MOCK_PROJECTS: Project[] = [
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

export const MOCK_ACTIVITIES: ActivityLog[] = [
    { id: '1', projectId: '1', message: 'Build completed in 1.2s', timestamp: 'Just now', type: 'success' },
    { id: '2', projectId: '3', message: 'Hot Reload connected', timestamp: '2m ago', type: 'info' },
    { id: '3', projectId: '4', message: 'Process crashed (PID 4021)', timestamp: '15m ago', type: 'error' },
    { id: '4', projectId: '2', message: 'Server stopped by user', timestamp: '1h ago', type: 'info' },
];

export const getIconForType = (type: string) => {
    switch(type) {
        case 'next': return <LayoutDashboard size={16} />;
        case 'react': return <Box size={16} />;
        case 'vite': return <Flame size={16} />;
        case 'node': return <Globe size={16} />;
        case 'python': return <Activity size={16} />;
        default: return <Box size={16} />;
    }
};