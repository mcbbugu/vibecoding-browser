import { getProjectCategory } from '../constants';

export const normalizeProjectUpdates = (updates = {}) => {
  const normalized = { ...updates };

  if (typeof normalized.name === 'string') {
    normalized.name = normalized.name.trim() || 'Untitled Project';
  }

  if (typeof normalized.url === 'string') {
    normalized.url = normalized.url.trim();
  }

  if (normalized.port === '' || normalized.port === undefined) {
    normalized.port = null;
  } else if (normalized.port !== null) {
    normalized.port = Number(normalized.port) || null;
  }

  if (typeof normalized.path === 'string') {
    normalized.path = normalized.path.trim();
  }

  if (typeof normalized.note === 'string') {
    normalized.note = normalized.note.trim();
  }

  normalized.category = getProjectCategory(normalized);

  return normalized;
};

export const detectProjectType = (port) => {
  if (port >= 3000 && port <= 3005) return 'next';
  if (port >= 5173 && port <= 5175) return 'vite';
  if (port === 8080 || port === 8081) return 'node';
  return 'react';
};

export const getProjectCommand = (type) => {
  const commands = {
    next: 'npm run dev',
    vite: 'npm run dev',
    react: 'npm start',
    node: 'npm run dev',
    python: 'python -m http.server',
    web: 'npm run dev'
  };
  return commands[type] || 'npm run dev';
};

