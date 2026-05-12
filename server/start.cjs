const { exec } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'index.js');
const proc = require('child_process').spawn('node', [serverPath], {
  cwd: __dirname,
  stdio: 'inherit'
});

proc.on('error', (err) => {
  console.error('Failed to start:', err);
});

console.log('Server starting...');
