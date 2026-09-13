const assert = require('assert');
const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());
app.use('/chat/v10', require('../scrapers/v10'));

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);

    try {
      // Test 1: Missing message
      console.log('Test 1: Missing message validation');
      const res1 = await makeRequest({
        hostname: '127.0.0.1',
        port,
        path: '/chat/v10',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {});
      assert.strictEqual(res1.status, 400);
      assert.ok(res1.data.error.includes('Message content is required'));

      // Test 2: Missing auth key when env key is missing
      console.log('Test 2: Missing auth validation');
      const savedKey = process.env.POLLINATIONS_API_KEY;
      const savedV10Key = process.env.V10_API_KEY;
      delete process.env.POLLINATIONS_API_KEY;
      delete process.env.V10_API_KEY;

      const res2 = await makeRequest({
        hostname: '127.0.0.1',
        port,
        path: '/chat/v10',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { userMessage: 'Hello' });
      assert.strictEqual(res2.status, 401);
      assert.ok(res2.data.error.includes('API key is required'));

      // Restore key
      process.env.POLLINATIONS_API_KEY = savedKey;
      process.env.V10_API_KEY = savedV10Key;

      // Test 3: If API key exists in environment, test live API call
      if (process.env.POLLINATIONS_API_KEY || process.env.V10_API_KEY) {
        console.log('Test 3: Valid userMessage request to Pollinations (live env key)');
        const res3 = await makeRequest({
          hostname: '127.0.0.1',
          port,
          path: '/chat/v10',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, { userMessage: 'Say "hello world" only.' });
        assert.strictEqual(res3.status, 200);
        assert.ok(res3.data.reply);
        assert.strictEqual(res3.data.api, 'pollinations (via gen.pollinations.ai)');

        // Test 4: Messages array and model parameter
        console.log('Test 4: Messages array and model parameter');
        const res4 = await makeRequest({
          hostname: '127.0.0.1',
          port,
          path: '/chat/v10',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          model: 'openai/gpt-5.4-nano',
          reasoning_effort: 'high',
          messages: [{ role: 'user', content: 'What is 2+2?' }]
        });
        assert.strictEqual(res4.status, 200);
        assert.ok(res4.data.reply.includes('4'));
      } else {
        console.log('Skipping live Pollinations API tests because POLLINATIONS_API_KEY env variable is not set.');
      }

      console.log('ALL TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('Test failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
