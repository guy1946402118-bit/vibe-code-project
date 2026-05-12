const { spawn } = require('child_process');
const server = spawn('node', ['server/dist/index.js'], {
  cwd: 'D:\\GrowthDashboard',
  stdio: 'inherit',
  shell: true,
  detached: true
});
server.unref();
console.log('Backend started');