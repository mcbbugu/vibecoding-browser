const net = require('net');

// 常用的开发服务器端口
const COMMON_PORTS = [
  3000, 3001, 3002, 3003, 3004, 3005, // React, Next.js
  5173, 5174, 5175, 5176, 5177, 5178, // Vite
  8080, 8081, 8082, 8000, 8888, // 常规 HTTP
  4200, 4201, // Angular
  9000, 9001, // 其他
  5000, 5001, // Flask, Python
  4000, 4001, // Gatsby
  6006, 6007, // Storybook
  1313, // Hugo
  2368, // Ghost
  10000, 10001, // Warp, Deno Deploy
  24678, // Bun
  7000, 7001, 7002, // Nuxt, Gridsome
];

// 开发常用端口范围
const PORT_RANGES = {
  vite: { start: 5173, end: 5180, name: 'Vite' },
  react: { start: 3000, end: 3010, name: 'React/Next.js' },
  http: { start: 8000, end: 8090, name: 'HTTP 服务' },
  angular: { start: 4200, end: 4210, name: 'Angular' },
  vue: { start: 8080, end: 8090, name: 'Vue' },
  python: { start: 5000, end: 5010, name: 'Python/Flask' },
  node: { start: 3000, end: 3050, name: 'Node.js' },
};

/**
 * 扫描单个端口
 */
async function scanPort(port, host = 'localhost', timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve({ port, isOpen: true });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, isOpen: false });
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve({ port, isOpen: false });
    });
    
    socket.connect(port, host);
  });
}

/**
 * 扫描常用端口（快速）
 */
async function scanCommonPorts() {
  const results = await Promise.all(
    COMMON_PORTS.map(port => scanPort(port))
  );
  
  return results.filter(result => result.isOpen);
}

/**
 * 扫描指定范围内的端口
 */
async function scanPortRange(start, end, concurrency = 50) {
  const ports = [];
  for (let port = start; port <= end; port++) {
    ports.push(port);
  }
  
  const results = [];
  
  // 分批并发扫描，避免创建过多 socket
  for (let i = 0; i < ports.length; i += concurrency) {
    const batch = ports.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(port => scanPort(port))
    );
    results.push(...batchResults.filter(r => r.isOpen));
  }
  
  return results;
}

/**
 * 扫描所有开发常用端口范围
 */
async function scanDevelopmentPorts(onProgress) {
  const allResults = [];
  const ranges = Object.values(PORT_RANGES);
  
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: ranges.length,
        range: range.name,
        scanning: `${range.start}-${range.end}`
      });
    }
    
    const results = await scanPortRange(range.start, range.end, 100);
    allResults.push(...results);
  }
  
  return allResults;
}

/**
 * 扫描所有可能的端口（1-65535），仅扫描常用范围
 */
async function scanAllPorts(onProgress) {
  // 只扫描常用的端口段，完整扫描太慢
  const quickRanges = [
    { start: 80, end: 90, name: 'HTTP' },        // HTTP
    { start: 443, end: 453, name: 'HTTPS' },     // HTTPS
    { start: 3000, end: 3100, name: 'Node.js' }, // Node.js 常用
    { start: 4000, end: 4300, name: 'Frontend' },// 前端框架
    { start: 5000, end: 5200, name: 'Python/Vite' }, // Python/Vite
    { start: 8000, end: 8100, name: 'HTTP Alt' },// 备用 HTTP
    { start: 9000, end: 9100, name: 'Misc' },    // 其他
    { start: 10000, end: 10100, name: 'High' },  // 高位端口
  ];
  
  const allResults = [];
  
  for (let i = 0; i < quickRanges.length; i++) {
    const range = quickRanges[i];
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: quickRanges.length,
        range: range.name,
        scanning: `${range.start}-${range.end}`
      });
    }
    
    const results = await scanPortRange(range.start, range.end, 100);
    allResults.push(...results);
  }
  
  return allResults;
}

module.exports = {
  scanPort,
  scanCommonPorts,
  scanPortRange,
  scanDevelopmentPorts,
  scanAllPorts,
  COMMON_PORTS,
  PORT_RANGES
};
