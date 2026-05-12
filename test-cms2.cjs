const http = require('http');

const request = (path, method = 'GET', body = null, token = null) => new Promise((resolve, reject) => {
  const options = { 
    hostname: 'localhost', 
    port: 3000, 
    path: '/api' + path, 
    method, 
    headers: { 'Content-Type': 'application/json' } 
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.on('error', reject);
  if (body) req.write(JSON.stringify(body));
  req.end();
});

(async () => {
  console.log('=== Testing CMS with Admin Login ===\n');
  
  // Step 1: Admin login
  console.log('1. POST /auth/login (admin login)');
  const login = await request('/auth/login', 'POST', { username: 'Lan', password: 'Wcnmsb123456' });
  console.log('Status:', login.status);
  const loginData = JSON.parse(login.body);
  console.log('Token:', loginData.token ? 'EXISTS' : 'MISSING');
  const token = loginData.token;
  console.log('');
  
  if (!token) {
    console.log('Login failed! Cannot test further.');
    return;
  }
  
  // Step 2: Get users with token
  console.log('2. GET /users (with token)');
  const users = await request('/users', 'GET', null, token);
  console.log('Status:', users.status);
  console.log('');
  
  // Step 3: Update user points with token
  console.log('3. PUT /users/:id (update points)');
  const userData = JSON.parse(users.body);
  if (userData && userData.length > 0) {
    const userId = userData[0].id;
    console.log('Updating user:', userData[0].name, 'ID:', userId);
    const updateResult = await request(`/users/${userId}`, 'PUT', { points: 999 }, token);
    console.log('Status:', updateResult.status);
    console.log('Response:', updateResult.body);
  }
  console.log('');
  
  // Step 4: Create blog post with token
  console.log('4. POST /blog/posts (with token)');
  const createPost = await request('/blog/posts', 'POST', { 
    title: 'Test Post from CMS', 
    slug: 'test-post-cms', 
    excerpt: 'Test excerpt', 
    content: 'Test content', 
    category: 'tech', 
    isPublished: true 
  }, token);
  console.log('Status:', createPost.status);
  console.log('Response:', createPost.body);
  console.log('');
  
  // Step 5: Get blog posts
  console.log('5. GET /blog/posts');
  const posts = await request('/blog/posts');
  console.log('Status:', posts.status);
  console.log('Posts:', posts.body.slice(0, 300));
})();
