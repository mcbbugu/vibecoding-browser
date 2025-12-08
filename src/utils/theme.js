import { storage } from './storage';

export const THEME_COLORS = {
  zinc: {
    name: 'Zinc',
    nameZh: '石墨灰',
    colors: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    }
  },
  indigo: {
    name: 'Indigo',
    nameZh: '靛蓝',
    colors: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    }
  },
  emerald: {
    name: 'Emerald',
    nameZh: '翠绿',
    colors: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    }
  },
  amber: {
    name: 'Amber',
    nameZh: '琥珀',
    colors: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    }
  },
  rose: {
    name: 'Rose',
    nameZh: '玫瑰',
    colors: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    }
  },
};

const STORAGE_KEY = 'accent-color';
const DEFAULT_THEME = 'zinc';

export function getAccentColor() {
  return storage.get(STORAGE_KEY, DEFAULT_THEME);
}

export function setAccentColor(colorName) {
  if (!THEME_COLORS[colorName]) {
    console.warn(`Unknown theme color: ${colorName}`);
    return;
  }
  storage.set(STORAGE_KEY, colorName);
  applyAccentColor(colorName);
}

export function applyAccentColor(colorName) {
  const theme = THEME_COLORS[colorName];
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([shade, value]) => {
    root.style.setProperty(`--accent-${shade}`, value);
  });
}

export function initTheme() {
  applyAccentColor(DEFAULT_THEME);
}
