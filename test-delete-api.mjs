import http from 'http';

async function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ name: 'Lan' });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/user/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body).token));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testDelete() {
  const token = await login();

  // Test delete user
  const deleteUserReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/3aea8ca9-32d7-4a89-b559-61c06c4015cf',
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => console.log('Delete User:', res.statusCode, body));
  });
  deleteUserReq.on('error', e => console.error('Error:', e));
  deleteUserReq.end();

  // Test delete blog post
  const deletePostReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/blog/posts/e2a71932-5dcf-4556-9d2e-b57b2910999c',
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => console.log('Delete Post:', res.statusCode, body));
  });
  deletePostReq.on('error', e => console.error('Error:', e));
  deletePostReq.end();
}

testDelete();