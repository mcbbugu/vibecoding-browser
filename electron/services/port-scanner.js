const net = require('net');
const http = require('http');

// 常用的开发服务器端口
const COMMON_PORTS = [
  3000, 3001, 3002, 3003, 3004, 3005, // React, Next.js
  3100, 3101, 3102, 3103, 3104, 3105, // 扩展 3xxx
  5173, 5174, 5175, 5176, 5177, 5178, // Vite
  5100, 5101, 5102, 5103, 5104, 5105, // 扩展 5xxx
  8080, 8081, 8082, 8000, 8888, // 常规 HTTP
  8100, 8101, 8102, 8103, 8104, 8105, // 扩展 8xxx
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
  9100, 9101, 9102, 9103, 9104,
  9200, 9201, 9202, 9203, 9204,
  9300, 9301, 9302, 9303, 9304
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
 * 验证端口是否是HTTP服务
 */
async function verifyHttpService(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: host,
        port: port,
        path: '/',
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      },
      (res) => {
        // 检查是否是有效的HTTP响应
        // 2xx, 3xx, 4xx 都算有效（404也说明是HTTP服务）
        // 只有完全无响应或非HTTP协议才返回false
        const isValid = res.statusCode >= 200 && res.statusCode < 600;
        
        // 读取一些数据确保服务器真的返回了内容
        let hasContent = false;
        res.on('data', () => {
          hasContent = true;
        });
        
        res.on('end', () => {
          // 如果状态码正常或有内容，认为是有效服务
          resolve(isValid || hasContent);
        });
        
        res.resume();
      }
    );

    req.on('error', (err) => {
      // 如果是连接被拒绝等错误，说明不是HTTP服务
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * 扫描单个端口（包含HTTP验证）
 */
async function scanPort(port, host = '127.0.0.1', timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', async () => {
      socket.destroy();
      
      const isHttp = await verifyHttpService(port, host);
      if (!isHttp && [3100, 3101, 5100, 8100].includes(port)) {
        console.log(`[PortScanner] Port ${port} TCP open but HTTP verify failed`);
      }
      resolve({ port, isOpen: isHttp });
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
  console.log('[PortScanner] Scanning ports:', COMMON_PORTS);
  const results = await Promise.all(
    COMMON_PORTS.map(port => scanPort(port))
  );
  
  const openPorts = results.filter(result => result.isOpen);
  console.log('[PortScanner] Found open ports:', openPorts);
  return openPorts;
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
