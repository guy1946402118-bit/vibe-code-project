import http from 'http';

async function postReq(path, method, data, token) {
  const body = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== 1. 普通用户登录 ===');
  const userLogin = await postReq('/api/auth/user/login', 'POST', { name: 'Lan' });
  console.log('Status:', userLogin.status, 'Token:', userLogin.body.token?.substring(0, 30) + '...');
  const userToken = userLogin.body.token;

  console.log('\n=== 2. 普通用户发布文章 ===');
  const postResult = await postReq('/api/blog/posts', 'POST', {
    title: '测试文章 - 普通用户发布',
    slug: 'test-article-' + Date.now(),
    excerpt: '这是一篇测试文章，用于验证博客发布功能。',
    content: '# 测试内容\n\n这篇文章由普通用户 Lan 发布。\n\n包含作者、时间等信息。',
    category: 'growth',
    isPublished: true,
    author: 'Lan',
    tags: ['测试', '博客'],
  }, userToken);
  console.log('Status:', postResult.status, 'ID:', postResult.body.id);
  console.log('Title:', postResult.body.title);
  console.log('Author:', postResult.body.author);
  console.log('Published:', postResult.body.publishedAt ? new Date(postResult.body.publishedAt).toLocaleString('zh-CN') : 'N/A');

  console.log('\n=== 3. 管理员登录 ===');
  const adminData = JSON.stringify({ username: 'Lan', password: 'Wcnmsb123456' });
  const adminLogin = await postReq('/api/auth/login', 'POST', { username: 'Lan', password: 'Wcnmsb123456' });
  console.log('Status:', adminLogin.status);
  const adminToken = adminLogin.body.token;

  console.log('\n=== 4. 管理员发布文章 ===');
  const adminPost = await postReq('/api/blog/posts', 'POST', {
    title: '官方公告 - 系统升级通知',
    slug: 'official-announce-' + Date.now(),
    excerpt: '系统将于下周一进行升级维护。',
    content: '# 系统升级通知\n\n我们将于下周一进行系统升级。\n\n届时可能会有短暂中断。',
    category: 'tech',
    isPublished: true,
    author: 'Lan',
    tags: ['官方', '公告'],
  }, adminToken);
  console.log('Status:', adminPost.status, 'Title:', adminPost.body.title);

  console.log('\n=== 5. 访客查看博客列表 ===');
  const listResult = await postReq('/api/blog/posts', 'GET');
  if (Array.isArray(listResult.body)) {
    console.log('文章总数:', listResult.body.length);
    listResult.body.forEach(p => {
      console.log(`  [${p.author}] ${p.title} - ${new Date(p.publishedAt).toLocaleDateString('zh-CN')}`);
    });
  } else {
    console.log('Response:', JSON.stringify(listResult.body));
  }
}

main().catch(console.error);