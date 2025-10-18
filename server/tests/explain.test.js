// server/tests/explain.test.js
// XAI test stub: demonstrates calling the explain-enabled endpoints.
// Note: This is a stub. Start the server (PORT=5000) and run with: `node server/tests/explain.test.js`
// Requires: process.env.TOKEN for Authorization header (if auth middleware requires logged-in token)

const axios = require('axios');

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const TOKEN = process.env.TOKEN || '';
const EMAIL = process.env.TEST_EMAIL || 'test@example.com';

axios.defaults.headers.common['Content-Type'] = 'application/json';
if (TOKEN) axios.defaults.headers.common['Authorization'] = `Bearer ${TOKEN}`;

async function testExplainTrue() {
  console.log('▶️ GET /recommendations?email=...&type=movies&explain=true');
  const res = await axios.get(`${BASE}/recommendations`, {
    params: { email: EMAIL, type: 'movies', explain: 'true' },
  });
  const items = res.data?.recommendations || [];
  console.log('Received', items.length, 'items');
  if (!items.length) {
    console.warn('No items returned; ensure preferences and API keys are configured.');
    return;
  }
  const first = items[0];
  if (!first.explanation) throw new Error('Missing explanation on first item');
  console.log('✅ explanation fields:', Object.keys(first.explanation));
}

async function testSingleExplain() {
  console.log('▶️ GET /recommendations/:id/explain?email=...');
  // First, fetch recommendations with explain to get a stable id
  const base = await axios.get(`${BASE}/recommendations`, {
    params: { email: EMAIL, type: 'movies', explain: 'true' },
  });
  const items = base.data?.recommendations || [];
  if (!items.length) {
    console.warn('No items to explain.');
    return;
  }
  const id = items[0].id;
  const res = await axios.get(`${BASE}/recommendations/${encodeURIComponent(id)}/explain`, {
    params: { email: EMAIL, type: 'movies' },
  });
  if (!res.data?.explanation) throw new Error('Single explanation endpoint missing explanation');
  console.log('✅ single explanation ok');
}

async function testGlobalExplain() {
  console.log('▶️ GET /recommendations/global-explain?type=movies');
  const res = await axios.get(`${BASE}/recommendations/global-explain`, {
    params: { type: 'movies' },
  });
  if (!res.data?.top_terms) throw new Error('Global explain missing top_terms');
  console.log('✅ global explain ok, terms:', res.data.top_terms.length);
}

(async () => {
  try {
    await testExplainTrue();
    await testSingleExplain();
    await testGlobalExplain();
    console.log('All XAI tests completed (stub).');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
})();
