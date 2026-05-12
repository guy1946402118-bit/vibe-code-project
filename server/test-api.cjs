const http = require('http');

const req = (path) => new Promise((resolve, reject) => {
  const options = { hostname: 'localhost', port: 3000, path: '/api' + path, method: 'GET' };
  const r = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  r.on('error', reject);
  r.end();
});

(async () => {
  const result = await req('/users/rankings');
  console.log('Status:', result.status);
  console.log('Body:', result.body);
})();
