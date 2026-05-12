import { api } from '../lib/api.js';

async function test() {
  try {
    console.log('--- Test 1: POST /users/register without token ---');
    const result = await api.post('/users/register', { name: 'testfrontenduser1' });
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
