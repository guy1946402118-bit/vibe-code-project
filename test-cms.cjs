const http = require('http');

const request = (path, method = 'GET', body = null) => new Promise((resolve, reject) => {
  const options = { hostname: 'localhost', port: 3000, path: '/api' + path, method, headers: { 'Content-Type': 'application/json' } };
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
  console.log('=== Testing CMS API ===\n');
  
  // Test 1: Get users
  console.log('1. GET /users');
  const users = await request('/users');
  console.log('Status:', users.status);
  console.log('Users:', users.body.slice(0, 200));
  console.log('');
  
  // Test 2: Get blog posts
  console.log('2. GET /blog/posts');
  const posts = await request('/blog/posts');
  console.log('Status:', posts.status);
  console.log('Posts:', posts.body.slice(0, 200));
  console.log('');
  
  // Test 3: Create user
  console.log('3. POST /users/register');
  const newUser = await request('/users/register', 'POST', { name: 'testuser123' });
  console.log('Status:', newUser.status);
  console.log('Response:', newUser.body);
  console.log('');
  
  // Test 4: Update user points
  console.log('4. PUT /users/:id (update points)');
  const userData = JSON.parse(users.body);
  if (userData && userData.length > 0) {
    const userId = userData[0].id;
    const updateResult = await request(`/users/${userId}`, 'PUT', { points: 100 });
    console.log('Status:', updateResult.status);
    console.log('Response:', updateResult.body);
  }
  console.log('');
  
  // Test 5: Create blog post (without auth - should fail)
  console.log('5. POST /blog/posts (without auth - expected to fail)');
  const createPost = await request('/blog/posts', 'POST', { title: 'Test Post', slug: 'test-post', excerpt: 'Test', content: 'Test content', category: 'tech', isPublished: true });
  console.log('Status:', createPost.status);
  console.log('Response:', createPost.body);
})();
