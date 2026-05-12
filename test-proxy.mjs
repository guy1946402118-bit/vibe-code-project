import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5174,
  path: '/api/users/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(JSON.stringify({ name: 'testfromproxy' }));
req.end();
