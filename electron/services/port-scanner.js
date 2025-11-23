const net = require('net');

const COMMON_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 5174, 5175, 8080, 8081, 8000, 4200, 9000, 5000, 8888, 4000, 6006];

async function scanPort(port, host = 'localhost', timeout = 1000) {
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

async function scanCommonPorts() {
  const results = await Promise.all(
    COMMON_PORTS.map(port => scanPort(port))
  );
  
  return results.filter(result => result.isOpen);
}

module.exports = {
  scanPort,
  scanCommonPorts,
  COMMON_PORTS
};

