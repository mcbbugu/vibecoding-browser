const { spawn } = require('child_process');
const path = require('path');

const runningProcesses = new Map();

async function startService(projectPath, command = 'npm run dev') {
  const [cmd, ...args] = command.split(' ');
  
  try {
    const process = spawn(cmd, args, {
      cwd: projectPath,
      shell: true,
      detached: false
    });

    const pid = process.pid;
    
    runningProcesses.set(pid, {
      process,
      projectPath,
      command,
      startTime: Date.now()
    });

    process.stdout.on('data', (data) => {
      console.log(`[${pid}] ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`[${pid}] ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Process ${pid} exited with code ${code}`);
      runningProcesses.delete(pid);
    });

    return { success: true, pid, message: 'Service started' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function stopService(pid) {
  const serviceInfo = runningProcesses.get(pid);
  
  if (!serviceInfo) {
    return { success: false, error: 'Service not found' };
  }

  try {
    serviceInfo.process.kill('SIGTERM');
    
    setTimeout(() => {
      if (runningProcesses.has(pid)) {
        serviceInfo.process.kill('SIGKILL');
      }
    }, 5000);

    return { success: true, message: 'Service stopped' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getRunningServices() {
  const services = [];
  
  runningProcesses.forEach((info, pid) => {
    services.push({
      pid,
      projectPath: info.projectPath,
      command: info.command,
      uptime: Date.now() - info.startTime
    });
  });
  
  return services;
}

module.exports = {
  startService,
  stopService,
  getRunningServices
};

