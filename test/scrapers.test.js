const { test, describe } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const http = require('node:http');

// Load main app
const app = require('../index.js');

// Helper function to send requests to express app without supertest dependency
function request(app, options) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const path = options.path || '/';
      const method = options.method || 'GET';
      const headers = options.headers || {};
      const bodyData = options.body ? JSON.stringify(options.body) : null;

      if (bodyData && !headers['content-type']) {
        headers['content-type'] = 'application/json';
      }

      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: headers
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          server.close();
          let json;
          try {
            json = JSON.parse(responseData);
          } catch {
            json = responseData;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    });
  });
}

describe('API Input Validation (HTTP 400 for missing or non-string userMessage)', () => {
  const versions = Array.from({ length: 14 }, (_, i) => i + 1);

  versions.forEach(v => {
    test(`POST /chat/v${v} should return 400 when userMessage is missing`, async () => {
      const res = await request(app, {
        method: 'POST',
        path: `/chat/v${v}`,
        body: {}
      });
      assert.strictEqual(res.status, 400, `v${v} did not return 400 for missing message`);
      assert.ok(res.body.error, `v${v} response missing error field`);
    });

    test(`POST /chat/v${v} should return 400 when userMessage is not a string`, async () => {
      const res = await request(app, {
        method: 'POST',
        path: `/chat/v${v}`,
        body: { userMessage: 12345 }
      });
      assert.strictEqual(res.status, 400, `v${v} did not return 400 for non-string message`);
      assert.ok(res.body.error, `v${v} response missing error field`);
    });
  });

  test('GET /chat/v1 should return 400 when userMessage query param is missing', async () => {
    const res = await request(app, {
      method: 'GET',
      path: '/chat/v1'
    });
    assert.strictEqual(res.status, 400);
  });
});

describe('Root Endpoint Healthcheck', () => {
  test('GET / should return 200 with status ok', async () => {
    const res = await request(app, {
      method: 'GET',
      path: '/'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });
});
