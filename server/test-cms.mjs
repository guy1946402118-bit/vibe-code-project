import http from 'http';

const loginData = JSON.stringify({ name: 'Lan' });

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/user/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', async () => {
    const loginResult = JSON.parse(body);
    const token = loginResult.token;
    console.log('Token:', token);
    
    // Test create user
    const createUserData = JSON.stringify({ name: 'newuserfromtest' });
    const createUserOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': createUserData.length,
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('\n--- Test CREATE USER ---');
    const req2 = http.request(createUserOptions, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => {
        console.log('Status:', res2.statusCode);
        console.log('Body:', body2);
      });
    });
    req2.on('error', (e) => console.error('Error:', e));
    req2.write(createUserData);
    req2.end();
  });
});

req.on('error', (e) => console.error('Login Error:', e));
req.write(loginData);
req.end();
