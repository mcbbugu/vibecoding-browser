export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  let normalized = url.trim();
  if (!normalized) return '';
  
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = normalized.startsWith('//') ? `http:${normalized}` : `http://${normalized}`;
  }
  
  return normalized;
};

export const isSearchQuery = (input) => {
  const trimmed = input.trim();
  return !trimmed.includes('.') && 
         !trimmed.includes('localhost') && 
         !trimmed.includes('127.0.0.1');
};

export const createSearchUrl = (query) => {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

export const extractHostname = (url = '') => {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || '未设置';
  }
};

