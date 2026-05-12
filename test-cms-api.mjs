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

async function testApi() {
  const token = await login();
  console.log('Token obtained');

  // Test create user
  const createUserData = JSON.stringify({ name: 'cmsuser' + Date.now() });
  const createReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': createUserData.length, 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => console.log('Create User:', res.statusCode, body));
  });
  createReq.on('error', e => console.error('Error:', e));
  createReq.write(createUserData);
  createReq.end();

  // Test create blog post
  const createPostData = JSON.stringify({ title: 'Test Post', slug: 'test-post-' + Date.now(), excerpt: 'Test', content: 'Content', category: 'tech', isPublished: true, author: 'admin', tags: [] });
  const postReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/blog/posts',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': createPostData.length, 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => console.log('Create Post:', res.statusCode, body));
  });
  postReq.on('error', e => console.error('Error:', e));
  postReq.write(createPostData);
  postReq.end();
}

testApi();