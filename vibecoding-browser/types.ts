export type ProjectType = 'react' | 'vue' | 'next' | 'vite' | 'node' | 'python';

export interface Project {
  id: string;
  name: string;
  url: string;
  port: number;
  status: 'running' | 'stopped' | 'starting' | 'error';
  space: string;
  path: string;
  type: ProjectType;
  lastOpened?: number;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface BrowserTab {
  id: string;
  projectId: string;
  title: string;
  url: string;
  isLoading: boolean;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
}

export interface ContextMenuPosition {
  x: number;
  y: number;
  projectId: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}