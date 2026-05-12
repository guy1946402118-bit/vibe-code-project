const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': json.length
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(json);
    req.end();
  });
}

async function test() {
  console.log('1. Testing login...');
  const loginResult = await post('/api/auth/login', { username: 'Kali', password: 'Wcnmsb123456' });
  console.log('Login result:', loginResult);
  
  if (loginResult.token) {
    console.log('\n2. Testing /api/users/me with token...');
    const token = loginResult.token;
    
    const req2 = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/me',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => console.log('Me result:', body));
    });
    req2.on('error', e => console.log('Error:', e));
    req2.end();
  }
}

test().catch(console.error);