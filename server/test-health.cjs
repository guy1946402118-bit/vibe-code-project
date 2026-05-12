const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Health:', body));
});
req.on('error', e => console.log('Error:', e.message));
req.end();
