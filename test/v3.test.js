const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../index.js');

test('POST /chat/v3 requires message content', (t, done) => {
  const server = app.listen(0, () => {
    const port = server.address().port;
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/chat/v3',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert.strictEqual(res.statusCode, 400);
        const json = JSON.parse(data);
        assert.ok(json.error);
        server.close(done);
      });
    });
    req.write(JSON.stringify({}));
    req.end();
  });
});

test('POST /chat/v3 disconnect handling closes stream without crashing', (t, done) => {
  const server = app.listen(0, () => {
    const port = server.address().port;
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/chat/v3',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    req.on('error', () => {});
    req.write(JSON.stringify({ userMessage: 'Hello, write a long response' }));
    req.end();

    setTimeout(() => {
      req.destroy();
      setTimeout(() => {
        server.close(done);
      }, 500);
    }, 50);
  });
});
