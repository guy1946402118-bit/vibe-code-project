const http = require('http');

const req = (path, method = 'GET', body = null) => new Promise((resolve, reject) => {
  const options = { hostname: 'localhost', port: 3000, path: '/api' + path, method, headers: { 'Content-Type': 'application/json' } };
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
      } catch {
        resolve({ status: res.statusCode, body: data });
      }
    });
  });
  req.on('error', reject);
  if (body) req.write(JSON.stringify(body));
  req.end();
});

(async () => {
  const users = await req('/users');
  console.log('Users:', JSON.stringify(users.body, null, 2));
})();
